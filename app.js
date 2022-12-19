//creating objects

class Workout {
  d = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat, lng]
    this.distance = distance; //in km
    this.duration = duration; //in min
  }

  _getDiscription() {
    // prettier-ignore
    let months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    this.description = `${this.type} on ${
      months[this.d.getMonth()]
    } ${this.d.getDate()}`;
  }
}
class Running extends Workout {
  type = "Running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace(); // min/km
    this._getDiscription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "Cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed(); // km/hr
    this._getDiscription();
  }

  calcSpeed() {
    //min/km
    this.calcSpeed = this.distance / (this.duration / 60);
    return this.calcSpeed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);

///////////////////////////////////////
// APPLICATION ARCHITECTURE
const form = document.querySelector(".form");
const workoutList = document.querySelector(".workout_list");

const typeValue = document.querySelector(".typeIp");
const distValue = document.querySelector(".distannceIp");
const durationValue = document.querySelector(".durationIp");
const stepsValue = document.querySelector(".stepsIp");
const elevGain = document.querySelector(".elevGain");
const ul = document.querySelector(".workout_list");
let lat;
let lon;
let workout;
class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPossition();
    this._getStoreWorkout();
    form.addEventListener("submit", this._newWorkout.bind(this));
    typeValue.addEventListener("change", this._toggleElevationField);
    ul.addEventListener("click", this._moveToMarker.bind(this));
  }

  _getPossition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("error");
        }
      );
    }
  }

  _loadMap(pos) {
    // alert("want to access your location");
    let latitude = pos.coords.latitude;
    let longitude = pos.coords.longitude;

    this.#map = L.map("map", {
      closePopupOnClick: false,
    }).setView([latitude, longitude], 13);
    this.#map.locate({ setView: true, maxZoom: 16 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.#map);

    //handling clicks on map
    this.#map.on("click", this._showForm.bind(this));
    this.#workouts.forEach((el) => {
      this._renderWorkoutMarker(el);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.style.display = "none";
    ////renders form when click on map

    if (form.style.display === "none") {
      form.style.display = "grid";
    }
  }

  _toggleElevationField() {
    if (typeValue.value === "Cycling") {
      elevGain.innerText = "Elev Gain";
      stepsValue.placeholder = "meter";
    }
    if (typeValue.value === "Running") {
      elevGain.innerText = "Cadence";
      stepsValue.placeholder = "steps/min";
    }
  }

  _newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    //Get data from form
    const type = typeValue.value;
    const distance = +distValue.value;
    const duration = +durationValue.value;
    lat = this.#mapEvent.latlng.lat;
    lon = this.#mapEvent.latlng.lng;
    //Hide form + clear input fields
    form.style.display = "none";

    //If workout is running, create running object
    if (typeValue.value === "Running") {
      const cadence = +stepsValue.value;

      //Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        form.style.display = "grid";
        return alert("inputs have to be finite number.");
      } else {
        //         stepIcon.src = "images/004-carbon-footprint.png";
        //         textStep.innerHTML = `${stepsValue.value} spm`;
        //         listItem.style.borderLeft = "8px solid  rgb(255, 204, 0)";

        workout = new Running([lat, lon], distance, duration, cadence);
        console.log(workout);
        this._renderWorkoutMarker(workout);
        //Render workout on map as marker
        // this.#workouts.forEach((el) => {
        //   this._renderWorkoutMarker(el);
        // });
      }
    }

    //If workout is cycling, create cycling object
    if (type === "Cycling") {
      const elevation = +stepsValue.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        form.style.display = "grid";
        return alert("inputs have to be finite number.");
      } else {
        //         stepIcon.src = "images/001-mountain-bike.png";
        //         textStep.innerHTML = `${stepsValue.value} meters`;
        //         listItem.style.borderLeft = "8px solid  rgb(0 255 37)";

        workout = new Cycling([lat, lon], distance, duration, elevation);
        this._renderWorkoutMarker(workout);
        // this.#workouts.forEach((el) => {
        //   this._renderWorkoutMarker(el);
        // });
        //Render workout on map as marker
      }
    }

    //Render workout on list
    this._renderWorkout(workout);

    //Add new object to workout array

    this.#workouts.push(workout);
    console.log(this.#workouts);

    this._setStoreWorkout();
    // this._getStoreWorkout();
  }

  _renderWorkoutMarker(workout) {
    console.log(workout);

    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(` ${workout.description}`, {
        autoClose: false,
        autoPan: false,
      })

      .openPopup();
    if (workout.type === "Running") {
      const mark2 = document.querySelectorAll(".leaflet-popup");
      mark2[mark2.length - 1].style.borderLeft = "8px solid rgb(255, 204, 0)";
    }
    if (workout.type === "Cycling") {
      const mark2 = document.querySelectorAll(".leaflet-popup");
      mark2[mark2.length - 1].style.borderLeft = "6px solid  rgb(0 255 37)";
    }
  }

  _renderWorkout(workout) {
    const workout_list_heading = document.querySelector(
      ".workout_list_heading"
    );
    const runIp = document.querySelector(".run_icon");
    const clockIp = document.querySelector(".clock_icon");
    const lightenIp = document.querySelector(".lighten_icon");
    const stepIp = document.querySelector(".step_icon");
    const stepImg = document.querySelector(".step-img");

    ul.style.display = "block";

    var listItem = document.createElement("li");
    listItem.setAttribute("id", workout.id);
    listItem.classList.add("workout_list1");
    listItem.classList.add("workout_list");
    ///append heading
    var listHeading = document.createElement("h1");
    listHeading.classList.add("workout_list_heading");
    listHeading.innerHTML = ` ${workout.description}`;
    listItem.append(listHeading);
    ///append icons-type
    var divWorkout_icons = document.createElement("div");
    divWorkout_icons.classList.add("workout_icons");
    var divSport = document.createElement("div");

    divSport.classList.add("sport");
    var typeIcon = document.createElement("img");

    divSport.append(typeIcon);
    var textType = document.createElement("p");
    textType.classList.add("text");
    textType.innerHTML = `${workout.distance} km`;
    divSport.append(textType);

    var clockIcon = document.createElement("img");
    clockIcon.src = "images/002-clock.png";
    divSport.append(clockIcon);
    var textClock = document.createElement("p");
    textClock.classList.add("clock_icon");
    textClock.innerHTML = `${workout.duration} min`;
    textClock.classList.add("text");
    divSport.append(textClock);

    var lightenIcon = document.createElement("img");
    lightenIcon.src = "images/003-light.png";
    divSport.append(lightenIcon);
    var textLighten = document.createElement("p");
    textLighten.classList.add("lighten_icon");

    textLighten.classList.add("text");
    divSport.append(textLighten);

    var stepIcon = document.createElement("img");
    var textStep = document.createElement("p");
    textStep.classList.add("text");
    textStep.classList.add("step_icon");
    divSport.append(stepIcon);
    divSport.append(textStep);

    if (workout.type === "Running") {
      listItem.classList.add("yellow-border");
      typeIcon.src = "images/001-sport.png";
      textLighten.innerHTML = `${workout.pace} min/km`;
      stepIcon.src = "images/004-carbon-footprint.png";
      textStep.innerHTML = `${workout.cadence} steps/min`;
    }

    if (workout.type === "Cycling") {
      listItem.classList.add("green-border");
      typeIcon.src = "images/001-mountain-bike.png";
      textLighten.innerHTML = `${workout.calcSpeed} km/hr`;
      stepIcon.src = "images/001-mountain.png";
      textStep.innerHTML = `${workout.elevationGain} meter`;
    }

    divWorkout_icons.append(divSport);
    listItem.append(divWorkout_icons);

    workoutList.prepend(listItem);
  }
  _moveToMarker(e) {
    const workoutEl = e.target.closest(".workout_list1");
    const found = this.#workouts.find((cObj) => cObj.id === workoutEl.id);

    this.#map.setView({ lat: found.coords[0], lng: found.coords[1] });
  }
  _setStoreWorkout() {
    localStorage.setItem("workout", JSON.stringify(this.#workouts));
  }

  _getStoreWorkout() {
    const storedworkots = JSON.parse(localStorage.getItem("workout"));
    console.log(storedworkots);
    if (!storedworkots) return;
    this.#workouts = storedworkots;
    this.#workouts.forEach((el) => {
      this._renderWorkout(el);
    });
  }

  reset() {
    localStorage.removeItem("workout");
    location.reload();
  }
}

const app = new App();
console.log(app);
// When the user scrolls the page, execute myFunction

///////////

///////////////////////////////////////////////////////////////////////
// function success(pos) {
//   let latitude = pos.coords.latitude;
//   let longitude = pos.coords.longitude;

//   var map = L.map("map").setView([latitude, longitude], 13);
//   L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
//     maxZoom: 19,
//     attribution:
//       '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
//   }).addTo(map);
// }

// const geolocation = navigator.geolocation;

// console.log(navigator.geolocation.getCurrentPosition(success));
