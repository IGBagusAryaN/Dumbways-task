async function getAllTestimonials() {
    try{
        let testimonials = await fetch("https://api.npoint.io/932630d755e4bf3bbf6f");
        testimonials = await testimonials.json()

        const testimonialHtml= await testimonials.map((item)=>{
           return `<div class="card col-lg-3 col-md-5 col-sm-5 p-3 m-2 rounded-3">
                              <img
                                src="${item.image}"
                                class="img-fluid profile-testimonial"
                              />
                              <p class="mt-2">${item.quote}</p>
                              <p class="text-end mb-1 fw-bold">${item.author}</p>
                              <p class="text-end fs-7">${item.rating} <i class="fa-solid fa-star fa-2xs"></i></p>
                          </div>
                          `;
        });
        document.getElementById("testimonials").innerHTML = testimonialHtml.join("");
    }catch(error){
        console.error(error)
    }
}

async function getFilteredTestimonials(rating) {
  try {
    let testimonials = await fetch(
      "https://api.npoint.io/932630d755e4bf3bbf6f"
    );
    testimonials = await testimonials.json();

    const filteredTestimonials = testimonials.filter((item) => {
      return item.rating === rating;
    });

    const testimonialHtml = filteredTestimonials.map((item) => {
      return `<div class="card col-lg-3 col-md-5 col-sm-5 p-3 m-2 rounded-3">
                              <img
                                src="${item.image}"
                                class="img-fluid profile-testimonial"
                              />
                              <p class="mt-2">${item.quote}</p>
                              <p class="text-end mb-1 fw-bold">${item.author}</p>
                              <p class="text-end fs-7">${item.rating} <i class="fa-solid fa-star fa-2xs"></i></p>
                          </div>
                          `;;
    });

    document.getElementById("testimonials").innerHTML =
      testimonialHtml.join("");
  } catch (error) {
    console.error(error);
  }
}

getAllTestimonials();
