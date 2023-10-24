mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/outdoors-v12",
  center: campground.geometry.coordinates,
  zoom: 9,
});

map.addControl(new mapboxgl.NavigationControl());

new mapboxgl.Marker({ color: "#FF0000" })
  .setLngLat(campground.geometry.coordinates)
  .setPopup(
    new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      closeOnMove: true,
    }).setHTML(
      `<h4>${campground.title}</h4><p class="mb-0">${campground.location}</p>`
    )
  )
  .addTo(map);
