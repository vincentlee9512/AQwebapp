//trying aq api
(function (){
    var app = angular.module('page', []);


//creating the map for webpage//////////////

    var stPaul = {
        lat: 44.9537,
        lng: -93.09,
        info: "some data"
    };
        //new google.maps.LatLng(44.9537, -93.09);

    var mapOptions = {
        center: stPaul,
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var mapDiv = document.getElementById('map');

    var map = new google.maps.Map(mapDiv, mapOptions);
////////////////////////////////////////////////////

//////create search box
    var searchBoxElement = $('#mapsearch')[0];

    var searchBox = new google.maps.places.SearchBox(searchBoxElement);

    map.controls[google.maps.ControlPosition.TOP_CENTER].push(searchBoxElement);

    searchBoxElement.placeholder = stPaul.lat + ", " + stPaul.lng;
//////////////////////////////////////////////////////////////////


//////add search and relocate action to search box
    google.maps.event.addListener(searchBox, 'places_changed', function(){
        var places = searchBox.getPlaces();

        var bounds = new google.maps.LatLngBounds();
        var i, place;


        for(i=0;place = places[i]; i++){

            bounds.extend(place.geometry.location);
        }

        map.fitBounds(bounds);
        map.setZoom(15);

    });

////////////////////////////////////////////////////



    // create map markers and marker's info window

    //infoObj is an object with 3 properties: lat, lng, and data that shows on the info window
    function createMarker(infoObj){
        var marker = new google.maps.Marker({
           position: infoObj,
           map: map,
        });

        var infoWindow = new google.maps.InfoWindow({
            content: infoObj.info
        });

        google.maps.event.addListener(marker, "mouseover", function(){
            infoWindow.open(map, marker);
        });

        google.maps.event.addListener(marker, 'mouseout', function(){
            infoWindow.close();
        });

        return marker;
    }

    //example for these two functions
    var stPaulmarker = createMarker(stPaul);

///////////////////////////////////////////////////////////////

////marker cluster

    ////here is just example for marker cluster
    var locations = [
        {lat: -31.563910, lng: 147.154312, info: "some date"},
        {lat: -33.718234, lng: 150.363181, info: "some date"},
        {lat: -33.727111, lng: 150.371124, info: "some date"},
        {lat: -33.848588, lng: 151.209834, info: "some date"},
        {lat: -33.851702, lng: 151.216968, info: "some date"},
        {lat: -34.671264, lng: 150.863657, info: "some date"},
        {lat: -35.304724, lng: 148.662905, info: "some date"},
        {lat: -36.817685, lng: 175.699196, info: "some date"},
        {lat: -36.828611, lng: 175.790222, info: "some date"},
        {lat: -37.750000, lng: 145.116667, info: "some date"},
        {lat: -37.759859, lng: 145.128708, info: "some date"},
        {lat: -37.765015, lng: 145.133858, info: "some date"},
        {lat: -37.770104, lng: 145.143299, info: "some date"},
        {lat: -37.773700, lng: 145.145187, info: "some date"},
        {lat: -37.774785, lng: 145.137978, info: "some date"},
        {lat: -37.819616, lng: 144.968119, info: "some date"},
        {lat: -38.330766, lng: 144.695692, info: "some date"},
        {lat: -39.927193, lng: 175.053218, info: "some date"},
        {lat: -41.330162, lng: 174.865694, info: "some date"},
        {lat: -42.734358, lng: 147.439506, info: "some date"},
        {lat: -42.734358, lng: 147.501315, info: "some date"},
        {lat: -42.735258, lng: 147.438000, info: "some date"},
        {lat: -43.999792, lng: 170.463352, info: "some date"}
    ];

    var i;
    var markers = [];
    for(i=0;i<locations.length;i++){
        var marker = createMarker(locations[i]);
        markers.push(marker);
    }


    var markerCluster = new MarkerClusterer(map, markers,
        {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

/////////////////////////////////////////////////////////////

////eventlistener that keep tracking the lat,lng for center and bounds(northeast point and southwest point)
    google.maps.event.addListener(map, "center_changed", function () {
        var centerObj = map.getCenter();

        mapCenter = centerObj.lat() + ', ' + centerObj.lng();

        var strHTML = ""+ centerObj.lat() + ', ' + centerObj.lng();

        searchBoxElement.placeholder = strHTML;
    });

    google.maps.event.addListener(map, "bounds_changed", function () {
        var bounds = map.getBounds();
        var ne = bounds.getNorthEast();
        var sw = bounds.getSouthWest();
        var strHTML = "North East: " + ne.lat() + ", " + ne.lng() + "<br/>";
        strHTML += "South West" + sw.lat() + ", " + sw.lng();

        $('#info')[0].innerHTML = strHTML;
    });


////////////////////////////////////////////////////////////////////////////////////////////




    app.controller('MapController', function ($http, $scope) {
        this.useMap = map;




        var url = 'https://api.openaq.org/v1/latest?coordinates=41.808,-71.415&radius=10000';



        $http.get(url).then(function(response) {
            $scope.datalist = response.data.results;

            console.log($scope.datalist);

        });
    });


})();