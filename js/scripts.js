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

    // import our demographic data that we converted to wgs84 in QGIS
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
            'fill-opacity': 0
        }
    });

    map.addLayer({
        id: 'planning-area-outline',
        type: 'line',
        source: 'planning-area',
        paint: {
            'line-color': '#000000', // Default stroke color (e.g., black)
            'line-opacity': 0.2,
            'line-width': 1 // Default planning area stroke weight
        }
    });

    map.on('click', 'fill-planning-area', (e) => {
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(e.features[0].properties.PLN_AREA_N)
            .addTo(map);
    });

    map.on('mousemove', 'fill-planning-area', (e) => {
        const selectedAreaText = document.getElementById('selected-area-text');
        const selectedAreaContainer = document.getElementById('selected-area-container');

        // Update the selected area text
        selectedAreaText.textContent = e.features[0].properties.PLN_AREA_N;

        // Set the hover state of the planning area
        map.setFeatureState(
            { source: 'planning-area', id: e.features[0].id },
            { hover: true }
        );

        // Increase the line width of the planning area outline for the hovered planning area
        map.setPaintProperty('planning-area-outline', 'line-width', [
            'case',
            ['==', ['id'], e.features[0].id], 5, // Hovered planning area stroke weight
            1 // Default planning area stroke weight
        ]);

        // Add active state to the container
        selectedAreaContainer.classList.add('active');

        // Get the metric data element
        const metricYouthDataElement = document.getElementById('metric-youth-data');
        const metricOldDataElement = document.getElementById('metric-old-data');
        const metricChineseDataElement = document.getElementById('metric-chinese-data');
        const metricMalayDataElement = document.getElementById('metric-malay-data');
        const metricIndianDataElement = document.getElementById('metric-indian-data');
        const metricPublicDataElement = document.getElementById('metric-public-data');

        // Update the content of the metric data element with the actual data
        metricYouthDataElement.textContent = `${e.features[0].properties['Version 1 Data_% Young']}%`;
        metricOldDataElement.textContent = `${e.features[0].properties['Version 1 Data_% Old']}%`;
        metricChineseDataElement.textContent = `${e.features[0].properties['Version 1 Data_% Chinese']}%`;
        metricMalayDataElement.textContent = `${e.features[0].properties['Version 1 Data_% Malay']}%`;
        metricIndianDataElement.textContent = `${e.features[0].properties['Version 1 Data_% Indian']}%`;
        metricPublicDataElement.textContent = `${e.features[0].properties['Version 1 Data_% Public']}%`;
    });

    map.on('mouseout', 'fill-planning-area', (e) => {
        const selectedAreaContainer = document.getElementById('selected-area-container');

        // Reset the hover state and line width of the planning area outline for the hovered planning area
        map.setFeatureState(
            { source: 'planning-area', id: e.features[0].id },
            { hover: false }
        );

        // Reset the line width of the planning area outline for all planning areas
        map.setPaintProperty('planning-area-outline', 'line-width', 1);

        // Remove active state from the container
        selectedAreaContainer.classList.remove('active');
    });

    // Optional: If you want to close other metric details when a new one is opened
    const metricCheckboxes = document.querySelectorAll('.metric-checkbox');
    const metricDetailsContainers = document.querySelectorAll('.metric-details');

    metricCheckboxes.forEach(function (checkbox, index) {
        checkbox.addEventListener('change', function () {
            if (checkbox.checked) {
                metricDetailsContainers.forEach(function (container, containerIndex) {
                    if (containerIndex === index) {
                        container.style.display = 'block';
                    } else {
                        container.style.display = 'none';
                        metricCheckboxes[containerIndex].checked = false;
                    }
                });
            } else {
                metricDetailsContainers[index].style.display = 'none';
            }
        });

        // Expand details for the default checked checkbox
        if (checkbox.checked) {
            metricDetailsContainers[index].style.display = 'block';
        }
    });

    // Define the generateLegend function
    function generateLegend(legendItems) {
        const legendContainer = document.getElementById('legend-container');
        legendContainer.innerHTML = ''; // Clear the container

        // Create the legend elements
        for (const item of legendItems) {
            const legendItem = document.createElement('div');
            legendItem.classList.add('legend-item');

            const legendColor = document.createElement('div');
            legendColor.classList.add('legend-color');
            legendColor.style.backgroundColor = item.color;

            const legendLabel = document.createElement('div');
            legendLabel.classList.add('legend-label');
            legendLabel.textContent = item.label;

            legendItem.appendChild(legendColor);
            legendItem.appendChild(legendLabel);

            legendContainer.appendChild(legendItem);
        }
    }

    // Add event listener to the "Youth Population" checkbox
    const metricYouthCheckbox = document.getElementById('metric-youth');
    metricYouthCheckbox.addEventListener('change', function () {
        if (metricYouthCheckbox.checked) {
            // Checkbox is checked, update map fill-color based on Youth Population data
            updateMapFillColorByYouthPopulation();
            generateLegend([
                { color: '#800000', label: '<= 15%' },
                { color: '#b81614', label: '15-16%' },
                { color: '#d13401', label: '16-17%' },
                { color: '#ffcd38', label: '17-18%' },
                { color: '#fdff33', label: '> 18%' }
            ]);
        }
    });

    // Implement the updateMapFillColorByYouthPopulation() function
    function updateMapFillColorByYouthPopulation() {
        map.setPaintProperty('fill-planning-area', 'fill-color', [
            'case',
            ['<=', ['get', 'Version 1 Data_% Young'], 15], '#800000',
            ['<=', ['get', 'Version 1 Data_% Young'], 16], '#b81614',
            ['<=', ['get', 'Version 1 Data_% Young'], 17], '#d13401',
            ['<=', ['get', 'Version 1 Data_% Young'], 18], '#ffcd38',
            '#fdff33'
        ]);

        map.setPaintProperty('fill-planning-area', 'fill-opacity', 0.8); // Update opacity value here
    }


    // Add event listener to the "Elderly Population" checkbox
    const metricOldCheckbox = document.getElementById('metric-old');
    metricOldCheckbox.addEventListener('change', function () {
        if (metricOldCheckbox.checked) {
            // Checkbox is checked, update map fill-color based on Elderly Population data
            updateMapFillColorByElderlyPopulation();
            generateLegend([
                { color: '#800000', label: '<= 9%' },
                { color: '#b81614', label: '9-12%' },
                { color: '#d13401', label: '12-15%' },
                { color: '#ffcd38', label: '15-18%' },
                { color: '#fdff33', label: '> 18%' }
            ]);
        }
    });

    // Implement the updateMapFillColorByElderlyPopulation() function
    function updateMapFillColorByElderlyPopulation() {
        map.setPaintProperty('fill-planning-area', 'fill-color', [
            'case',
            ['<=', ['get', 'Version 1 Data_% Old'], 9], '#800000',
            ['<=', ['get', 'Version 1 Data_% Old'], 12], '#b81614',
            ['<=', ['get', 'Version 1 Data_% Old'], 15], '#d13401',
            ['<=', ['get', 'Version 1 Data_% Old'], 18], '#ffcd38',
            '#fdff33'
        ]);

        map.setPaintProperty('fill-planning-area', 'fill-opacity', 0.8); // Update opacity value here
    }

    // Add event listener to the "Chinese Population" checkbox
    const metricChineseCheckbox = document.getElementById('metric-chinese');
    metricChineseCheckbox.addEventListener('change', function () {
        if (metricChineseCheckbox.checked) {
            // Checkbox is checked, update map fill-color based on Chinese Population data
            updateMapFillColorByChinesePopulation();
            generateLegend([
                { color: '#800000', label: '<= 70%' },
                { color: '#b81614', label: '70-75%' },
                { color: '#d13401', label: '75-80%' },
                { color: '#ffcd38', label: '80-85%' },
                { color: '#fdff33', label: '> 85%' }
            ]);
        }
    });

    // Implement the updateMapFillColorByChinesePopulation() function
    function updateMapFillColorByChinesePopulation() {
        map.setPaintProperty('fill-planning-area', 'fill-color', [
            'case',
            ['<=', ['get', 'Version 1 Data_% Chinese'], 70], '#800000',
            ['<=', ['get', 'Version 1 Data_% Chinese'], 75], '#b81614',
            ['<=', ['get', 'Version 1 Data_% Chinese'], 80], '#d13401',
            ['<=', ['get', 'Version 1 Data_% Chinese'], 85], '#ffcd38',
            '#fdff33'
        ]);

        map.setPaintProperty('fill-planning-area', 'fill-opacity', 0.8); // Update opacity value here
    }

    // Add event listener to the "Malay Population" checkbox
    const metricMalayCheckbox = document.getElementById('metric-malay');
    metricMalayCheckbox.addEventListener('change', function () {
        if (metricMalayCheckbox.checked) {
            // Checkbox is checked, update map fill-color based on Malay Population data
            updateMapFillColorByMalayPopulation();
            generateLegend([
                { color: '#800000', label: '<= 5%' },
                { color: '#b81614', label: '5-10%' },
                { color: '#d13401', label: '10-15%' },
                { color: '#ffcd38', label: '15-20%' },
                { color: '#fdff33', label: '> 20%' }
            ]);
        }
    });

    // Implement the updateMapFillColorByMalayPopulation() function
    function updateMapFillColorByMalayPopulation() {
        map.setPaintProperty('fill-planning-area', 'fill-color', [
            'case',
            ['<=', ['get', 'Version 1 Data_% Malay'], 5], '#800000',
            ['<=', ['get', 'Version 1 Data_% Malay'], 10], '#b81614',
            ['<=', ['get', 'Version 1 Data_% Malay'], 15], '#d13401',
            ['<=', ['get', 'Version 1 Data_% Malay'], 20], '#ffcd38',
            '#fdff33'
        ]);

        map.setPaintProperty('fill-planning-area', 'fill-opacity', 0.8); // Update opacity value here
    }

    // Add event listener to the "Indian Population" checkbox
    const metricIndianCheckbox = document.getElementById('metric-indian');
    metricIndianCheckbox.addEventListener('change', function () {
        if (metricIndianCheckbox.checked) {
            // Checkbox is checked, update map fill-color based on Indian Population data
            updateMapFillColorByIndianPopulation();
            generateLegend([
                { color: '#800000', label: '<= 8%' },
                { color: '#b81614', label: '8-10%' },
                { color: '#d13401', label: '10-12%' },
                { color: '#ffcd38', label: '12-14%' },
                { color: '#fdff33', label: '> 14%' }
            ]);
        }
    });

    // Implement the updateMapFillColorByIndianPopulation() function
    function updateMapFillColorByIndianPopulation() {
        map.setPaintProperty('fill-planning-area', 'fill-color', [
            'case',
            ['<=', ['get', 'Version 1 Data_% Indian'], 8], '#800000',
            ['<=', ['get', 'Version 1 Data_% Indian'], 10], '#b81614',
            ['<=', ['get', 'Version 1 Data_% Indian'], 12], '#d13401',
            ['<=', ['get', 'Version 1 Data_% Indian'], 14], '#ffcd38',
            '#fdff33'
        ]);

        map.setPaintProperty('fill-planning-area', 'fill-opacity', 0.8); // Update opacity value here
    }

    // Add event listener to the "Public Housing" checkbox
    const metricPublicCheckbox = document.getElementById('metric-public');
    metricPublicCheckbox.addEventListener('change', function () {
        if (metricPublicCheckbox.checked) {
            // Checkbox is checked, update map fill-color based on Public Housing data
            updateMapFillColorByPublicHousing();
            generateLegend([
                { color: '#800000', label: '<= 50%' },
                { color: '#b81614', label: '50-60%' },
                { color: '#d13401', label: '60-80%' },
                { color: '#ffcd38', label: '80-90%' },
                { color: '#fdff33', label: '> 90%' }
            ]);
        }
    });

    // Implement the updateMapFillColorByPublicHousing() function
    function updateMapFillColorByPublicHousing() {
        map.setPaintProperty('fill-planning-area', 'fill-color', [
            'case',
            ['<=', ['get', 'Version 1 Data_% Public'], 50], '#800000',
            ['<=', ['get', 'Version 1 Data_% Public'], 60], '#b81614',
            ['<=', ['get', 'Version 1 Data_% Public'], 80], '#d13401',
            ['<=', ['get', 'Version 1 Data_% Public'], 90], '#ffcd38',
            '#fdff33'
        ]);

        map.setPaintProperty('fill-planning-area', 'fill-opacity', 0.8); // Update opacity value here
    }
});