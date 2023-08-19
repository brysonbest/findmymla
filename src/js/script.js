import axios from "axios";

let d = new Date();

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

async function runSearch() {
  const postal = document.getElementById("postal").value.replace(" ", "");
  const geocodeURL = `https://geocoder.ca/?locate=${postal}&geoit=XML&json=1`;
  let representURL = `https://represent.opennorth.ca/postcodes/${postal}/`;
  let geocoded = false;
  try {
    let response = await axios.get(geocodeURL);
    let data = await response.data;
    let lat = data["latt"];
    let long = data["longt"];
    representURL = `https://represent.opennorth.ca/representatives/?point=${lat}%2C${long}`;
    geocoded = true;
  } catch (error) {
    console.log(error);
  } finally {
    try {
      let finalData = await axios.get(representURL);
      let finalDataJSON = await finalData.data;
      return finalDataJSON;
    } catch (error) {
      console.log(error);
    }
  }
}

async function searchPostal() {
  toggleLoading();
  await runSearch().then((data) => {
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
  // alert("Hello Local!");
  // dynamicFormSearch();
  toggleLoading();
  setTimeout(toggleLoading, 5000);
}

addEventListener("submit", (event) => {
  event.preventDefault();
  searchPostal().then(() => {
    toggleLoading().then(() => {
      flipSearch().then(() => {
        dynamicFormSearch();
      });
    });
  });
});

// document.getElementById("searchpostal").addEventListener("click", searchPostal);

document.getElementById("searchlocal").addEventListener("click", searchLocal);
