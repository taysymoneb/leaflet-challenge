// create the tile layers for the backgrounds of the map
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// watercolor layer 
var watercolor = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.{ext}', {
    minZoom: 1,
    maxZoom: 16,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'jpg'
});

// world imagery layer
var worldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// make a basemaps object
let basemaps = {
    Default: defaultMap,
    "Water Color": watercolor,
    "World Imagery": worldImagery
};

// Make a map object
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 5,
    layers: [defaultMap]
});

// adding default map to the map
defaultMap.addTo(myMap);

L.control
    .layers(basemaps)
    .addTo(myMap);

//function to get the color based on the depth
function getColor(depth) {
    if (depth > 90)
        return "red";
    else if (depth > 70)
        return "orangered";
    else if (depth > 50)
        return "darkorange";
    else if (depth > 30)
        return "orange";
    else if (depth > 10)
        return "yellow";
    else
        return "springgreen";
}

// radius size based on magnitude
function radiusSize(magnitude) {
    return magnitude * 5; 
}

// data for tectonic plate layers 
let tectonicplates = new L.layerGroup();

// api call for tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json")
    .then(function(plateData) {
        // tectonic plates layer group
        L.geoJson(plateData, {
            // styling for plate lines
            color: "green",
            weight: 1
        }).addTo(tectonicplates);
    });

// adding tectonic plates data to map
tectonicplates.addTo(myMap);

// var for earthquake data layer
let earthquakes = new L.layerGroup();

// 
// api call to get the data for the earthquakes and populate layers
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson")
    .then(function(earthquakeData) {

        // Add style to data point
        function dataStyle(feature) {
            return {
                opacity: 0.6,
                fillOpacity: 0.5,
                fillColor: getColor(feature.geometry.coordinates[2]), 
                color: "black",
                radius: radiusSize(feature.properties.mag), 
                weight: 0.5,
            }
        }

        // adding geojson data to earthquake layer group
        L.geoJson(earthquakeData, {
            //circle markers on map
            pointToLayer: function(feature, latLng) {
                return L.circleMarker(latLng);
            },
            // style for the markers
            style: dataStyle,

            // function for the popups
            onEachFeature: function(feature, layer) {
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                                Location: <b>${feature.properties.place}</b>`);
            }
        }).addTo(earthquakes);
    });

// earthquakes to map
earthquakes.addTo(myMap);

// tectonic plate overlay
let overlays = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes
};

// legend to the map added
var legend = L.control({ position: 'bottomright' });

legend.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'info legend'),
        depths = [-10, 10, 30, 50, 70, 90],
        labels = [];

    // looping through depth intervals and generating a label with a colored square for each interval
    for (var i = 0; i < depths.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(depths[i] + 1) + '"></i> ' +
            depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + '<br>' : '+');
    }

    return div;
};

legend.addTo(myMap);
