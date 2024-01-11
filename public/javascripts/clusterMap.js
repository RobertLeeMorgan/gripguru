mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
  container: "cluster-map",
  // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
  style: "mapbox://styles/mapbox/outdoors-v12",
  center: gyms.features[0].geometry.coordinates,
});

const bounds = new mapboxgl.LngLatBounds();

gyms.features.forEach(function (f) {
  bounds.extend(f.geometry.coordinates);
});

map.fitBounds(bounds, {
  padding: { top: 20, bottom: 20 },
  maxZoom: 9,
});

if (gyms.features.length < 10) {
  const { popUpMarkup } = gyms.features[0].properties;

  map.fitBounds(bounds, {
    padding: { top: 40, bottom: 40 },
    maxZoom: 9,
    minZoom: 3,
    center: gyms.features[0].geometry.coordinates,
  });

  const marker = new mapboxgl.Marker({ color: "#FF0000" })
    .setLngLat(gyms.features[0].geometry.coordinates, { offset: 5 })
    .setPopup(new mapboxgl.Popup().setHTML(popUpMarkup)) // add popup
    .addTo(map)
    .togglePopup();
}
map.addControl(new mapboxgl.NavigationControl());

map.on("load", () => {
  // Add a new source from our GeoJSON data and
  // set the 'cluster' option to true. GL-JS will
  // add the point_count property to your source data.

  map.addSource("gyms", {
    type: "geojson",
    // Point to GeoJSON data. This example visualizes all M1.0+ gyms
    // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
    data: gyms,
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
  });

  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "gyms",
    filter: ["has", "point_count"],
    paint: {
      // Use step expressions (https://docs.mapbox.com/style-spec/reference/expressions/#step)
      // with three steps to implement three types of circles:
      //   * Blue, 20px circles when point count is less than 100
      //   * Yellow, 30px circles when point count is between 100 and 750
      //   * Pink, 40px circles when point count is greater than or equal to 750
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#ABFF2A",
        10,
        "#A2DA22",
        30,
        "#C3F64E",
      ],
      "circle-radius": ["step", ["get", "point_count"], 20, 10, 25, 50, 35],
    },
  });

  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "gyms",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
  });

  map.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: "gyms",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#8FE000",
      "circle-radius": 9,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  });

  // inspect a cluster on click
  map.on("click", "clusters", (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ["clusters"],
    });
    const clusterId = features[0].properties.cluster_id;
    map
      .getSource("gyms")
      .getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
        });
      });
  });

  // When a click event occurs on a feature in
  // the unclustered-point layer, open a popup at
  // the location of the feature, with
  // description HTML from its properties.
  map.on("click", "unclustered-point", (e) => {
    const { popUpMarkup } = e.features[0].properties;
    const coordinates = e.features[0].geometry.coordinates.slice();

    // Ensure that if the map is zoomed out such that
    // multiple copies of the feature are visible, the
    // popup appears over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup({ offset: 25 })
      .setLngLat(coordinates)
      .setHTML(popUpMarkup)
      .addTo(map);
  });

  map.on("mouseenter", "clusters", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "clusters", () => {
    map.getCanvas().style.cursor = "";
  });
});
