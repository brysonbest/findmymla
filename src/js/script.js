import axios from "axios";

let d = new Date();
const errorLine = document.getElementById("search-error");
let coordinates = [];

var x = document.getElementById("search-error");

function getTest() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(showPositionTest);
  } else {
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPositionTest(position) {
  x.innerHTML =
    "Latitude: " +
    position.coords.latitude +
    "<br>Longitude: " +
    position.coords.longitude;
}

async function dynamicFormSearch() {
  const y = document.getElementById("search-form");
  const x = document.getElementById("form-response");
  if (x.style.display === "none") {
    x.style.display = "block";
    y.style.display = "none";
  }

  const postal = document.getElementById("searchpostal");
  const local = document.getElementById("searchlocal");
  postal.disabled = true;
  local.disabled = true;
}

async function flipSearch() {
  const x = document.getElementById("search-widget");
  if (x.classList.contains("flipsearch")) {
    x.classList.remove("flipsearch");
  } else {
    x.classList.add("flipsearch");
  }
}

async function toggleLoading() {
  const x = document.getElementById("search-loading");
  const y = document.getElementById("search-widget-inner");
  if (x.style.display === "none") {
    x.style.display = "block";
    y.style.display = "none";
  } else {
    x.style.display = "none";
    y.style.display = "block";
  }
}

async function representSearch(lat, long, postal) {
  const representURL = `https://represent.opennorth.ca/postcodes/${postal}/`;
  let finalURL = representURL;

  if (typeof lat !== "undefined" && typeof long !== "undefined") {
    finalURL = `https://represent.opennorth.ca/representatives/?point=${lat}%2C${long}`;
  }
  try {
    console.log("this is final url", finalURL);
    let finalData = await axios.get(finalURL);
    let finalDataJSON = await finalData.data;
    console.log(finalDataJSON, "this is finaldata 1");
    return finalDataJSON;
  } catch (error) {
    try {
      let finalData = await axios.get(representURL);
      let finalDataJSON = await finalData.data;
      return finalDataJSON;
    } catch (error) {
      console.log(error);
    }
  }
}

async function showPosition(position) {
  coordinates.push(position.coords.latitude);
  coordinates.push(position.coords.longitude);
}

const getCoords = async () => {
  const pos = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, showError);
  });

  return {
    long: pos.coords.longitude,
    lat: pos.coords.latitude,
  };
};

let coords = {};

async function getLocation() {
  if (navigator.geolocation) {
    coords = await getCoords();
  } else {
    errorLine.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorLine.innerHTML = "User denied the request for Geolocation.";
      break;
    case error.POSITION_UNAVAILABLE:
      errorLine.innerHTML = "Location information is unavailable.";
      break;
    case error.TIMEOUT:
      errorLine.innerHTML = "The request to get user location timed out.";
      break;
    case error.UNKNOWN_ERROR:
      errorLine.innerHTML = "An unknown error occurred.";
      break;
  }
}

async function runSearch(variation) {
  let lat;
  let long;
  let geocoded;

  if (variation === "local") {
    await getLocation();
    console.log(coords, "this is coordinates");
    lat = coords.lat;
    long = coords.long;
    geocoded = false;
  } else {
    geocoded = true;
  }

  const postal = document.getElementById("postal").value.replace(" ", "");
  const geocodeURL = `https://geocoder.ca/?locate=${postal}&geoit=XML&json=1`;

  try {
    if (geocoded) {
      let response = await axios.get(geocodeURL);
      let data = await response.data;
      lat = data["latt"];
      long = data["longt"];
    }
  } catch (error) {
    console.log(error);
  } finally {
    try {
      let finalDataJSON = await representSearch(lat, long, postal);
      console.log(finalDataJSON, "this is finaldata after local search");
      return finalDataJSON;
    } catch (error) {
      console.log(error);
    }
  }
}

async function search(variation) {
  toggleLoading();
  await runSearch(variation).then((data) => {
    const filtered_for_mla = data.objects.filter((item) => {
      if (
        typeof item["elected_office"] !== "undefined" ||
        item["elected_office"] !== null
      ) {
        return (
          item["elected_office"].includes("MLA") ||
          item["elected_office"].includes("MPP") ||
          item["elected_office"].includes("MNA") ||
          item["elected_office"].includes("MHA")
        );
      }
    });

    const mla = filtered_for_mla[0]["elected_office"].toUpperCase();
    const mla_name = filtered_for_mla[0]["name"];
    const mla_party = filtered_for_mla[0]["party_name"];
    const mla_email = filtered_for_mla[0]["email"];
    const mla_phone = filtered_for_mla[0]["offices"][0]["tel"];
    const mla_district = filtered_for_mla[0]["district_name"];

    if (typeof mla_email === "undefined" || mla_email === null) {
      mla_email = "No email found";
    }
    document.getElementById("mla").innerHTML = mla;
    document.getElementById("mla_name").innerHTML = mla_name;
    document.getElementById("mla_party").innerHTML = mla_party;
    document.getElementById("mla_district").innerHTML = mla_district;
    document.getElementById("mla_phone").innerHTML = mla_phone;
    document.getElementById("mla_email").innerHTML = mla_email;
  });
}

function searchLocal() {
  search("local").then(() => {
    toggleLoading().then(() => {
      flipSearch().then(() => {
        dynamicFormSearch();
      });
    });
  });
}

addEventListener("submit", (event) => {
  event.preventDefault();
  search("postal").then(() => {
    toggleLoading().then(() => {
      flipSearch().then(() => {
        dynamicFormSearch();
      });
    });
  });
});

document.getElementById("searchlocal").addEventListener("click", searchLocal);
