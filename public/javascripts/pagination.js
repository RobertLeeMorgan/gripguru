const paginate = document.getElementById('paginate');
const $campgroundsContainer = $('#campgrounds-container');
paginate.addEventListener('click', function(e) {
    e.preventDefault();
    fetch(this.href)
        .then(response => response.json())
        .then(data => {
            for(const campground of data.docs) {
                let template = generateCampground(campground);
                $campgroundsContainer.append(template);
            }
            let { nextPage } = data;
            this.href = this.href.replace(/page=\d+/, `page=${nextPage}`);
            campgrounds.features.push(...data.docs);
            map.getSource('campgrounds').setData(campgrounds);
        })
        .catch(err => console.log('ERROR',err));
})

function generateCampground(campground) {
    let template = `<div class="card mb-3">
    <div class="row d-flex align-items-center">
      <div class="col-md-4 text-center text-md-start mt-2 mt-md-0">
        <img
          crossorigin="anonymous"
          class="img-fluid"
          alt=""
          src="${ campground.images[0].url.replace("/upload", "/upload/h_250,w_400,c_fill") }"
        />
      </div>
      <div class="col-md-8 text-center text-md-start">
        <div class="card-body">
          <h4 class="card-title mb-2">${ campground.title }</h4>
          <p class="card-text mb-2 me-md-5">${ campground.description.substring(0, 140) }</p>
          <p class="card-text">
            <p class="text-secondary mb-4">${ campground.location }</p>
          </p>
          <a href="/campgrounds/${ campground._id }" class="btn btn-success"
            >View Details</a>
        </div>
      </div>
    </div>
  </div>`;
    return template;
}