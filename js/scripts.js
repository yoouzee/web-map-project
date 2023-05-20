mapboxgl.accessToken = 'pk.eyJ1IjoieW9vdXplZSIsImEiOiJjbGc1cWoweWkwNjAwM2Vwbzc1cGVyNmxsIn0.dgHHzAHSakJWLbVW4jFoHQ';

const map = new mapboxgl.Map({
    container: "map", // container ID
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    style: "mapbox://styles/mapbox/streets-v12", // style URL
    center: [103.8, 1.35], // starting position [lng, lat]
    zoom: 11, // starting zoom
    minZoom: 10, // set min zoom
    maxZoom: 13 // set max zoom
});
map.addControl(new mapboxgl.NavigationControl());

map.on('load', function () {

    // import our election data that we converted to wgs84 in QGIS
    map.addSource('planning-area', {
        type: 'geojson',
        data: './data/Version_1_Data.geojson',
        generateId: true
    })

    map.addLayer({
        id: 'fill-planning-area',
        type: 'fill',
        source: 'planning-area',
        paint: {
            'fill-color': [
                'case',
                ['<=', ['get', 'Version 1 Data_% Public'], 20], '#accbff', // lightest blue
                ['<=', ['get', 'Version 1 Data_% Public'], 40], '#92bbff', // light blue
                ['<=', ['get', 'Version 1 Data_% Public'], 60], '#78aaff', // medium blue
                ['<=', ['get', 'Version 1 Data_% Public'], 80], '#649eff', // dark blue
                '#4188ff' // darkest blue
            ],
            'fill-opacity': 0.8
        }
    });

    map.addLayer({
        id: 'area-outline',
        type: 'line',
        source: 'planning-area',
        paint: {
            'line-color': '#000000',
            'line-opacity': 0.2,
            'line-width': 1
        }
    });

    map.on('click', 'fill-planning-area', (e) => {
        console.log('foo', e.features)

        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(e.features[0].properties.PLN_AREA_N)
            .addTo(map);
    });

    // Optional: If you want to close other metric details when a new one is opened
    const metricCheckboxes = document.querySelectorAll('.metric-checkbox');
    metricCheckboxes.forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
            const metricDetails = this.parentNode.querySelector('.metric-details');
            // Toggle the display of metric details
            metricDetails.style.display = this.checked ? 'block' : 'none';

            // Hide all other metric details
            metricCheckboxes.forEach(function (otherCheckbox) {
                if (otherCheckbox !== checkbox) {
                    const otherMetricDetails = otherCheckbox.parentNode.querySelector('.metric-details');
                    otherMetricDetails.style.display = 'none';
                }
            });
        });
    });
});