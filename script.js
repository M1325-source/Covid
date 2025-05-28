let selectedYear = "2023";
let chart;

const yearSelect = document.getElementById("year-select");
const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      onEachFeature: (feature, layer) => {
        layer.on('click', () => getCovidData(feature.properties.name));
      },
      style: {
        color: '#555',
        fillColor: '#aed581',
        fillOpacity: 0.4,
        weight: 1
      }
    }).addTo(map);
  });

yearSelect.addEventListener("change", () => {
  selectedYear = yearSelect.value;
});

function getCovidData(country) {
  fetch(`https://disease.sh/v3/covid-19/historical/${country}?lastdays=all`)
    .then(res => res.json())
    .then(data => {
      const timeline = data.timeline || data;
      const cases = {}, deaths = {}, recovered = {};

      for (let date in timeline.cases) {
        const y = "20" + date.split('/')[2];
        cases[y] = (cases[y] || 0) + timeline.cases[date];
        deaths[y] = (deaths[y] || 0) + timeline.deaths[date];
        recovered[y] = (recovered[y] || 0) + timeline.recovered[date];
      }

      const year = selectedYear;
      document.getElementById("country-name").innerText = data.country || country;
      document.getElementById("cases").innerText = (cases[year] || 0).toLocaleString();
      document.getElementById("deaths").innerText = (deaths[year] || 0).toLocaleString();
      document.getElementById("recovered").innerText = (recovered[year] || 0).toLocaleString();

      renderChart(cases, deaths, recovered);
    })
    .catch(() => alert("Data not available for " + country));
}

function renderChart(cases, deaths, recovered) {
  const labels = Object.keys(cases).sort();
  const casesData = labels.map(y => cases[y]);
  const deathsData = labels.map(y => deaths[y]);
  const recoveredData = labels.map(y => recovered[y]);

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("chart"), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: "Cases", data: casesData, borderColor: "blue", fill: false },
        { label: "Deaths", data: deathsData, borderColor: "red", fill: false },
        { label: "Recovered", data: recoveredData, borderColor: "green", fill: false }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "COVID Trends by Year" }
      }
    }
  });
}

function loadTopCountries() {
  fetch('https://disease.sh/v3/covid-19/countries?sort=cases')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('top-stats');
      data.slice(0, 5).forEach(c => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `<strong>${c.country}</strong><br>Cases: ${c.cases.toLocaleString()}`;
        container.appendChild(card);
      });
    });
}

document.getElementById("toggle-mode").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

loadTopCountries();
