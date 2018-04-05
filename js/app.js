//trying aq api
(function (){
    var app = angular.module('page', []);

    //creating the map for webpage//////////////

    var stPaul = {
        lat: 44.9537,
        lng: -93.09,
        info: "some data"
    };

    var mapOptions = {
        center: stPaul,
        zoom: 12,
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
        var latLng = {
            lat: infoObj.coordinates.latitude,
            lng: infoObj.coordinates.longitude
        }

        var marker = new google.maps.Marker({
            position: latLng,
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

///////////////////////////////////////////////////////////////

////marker cluster

    ////here is just example for marker cluster
    function createMarkerCluster(formattedArray){
        var i;
        var markers = [];

        for(i=0;i<formattedArray.length;i++){
            var marker = createMarker(formattedArray[i]);
            markers.push(marker);
        }

        var markerCluster = new MarkerClusterer(map, markers,
            {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});

    }
    /*

    var locations = [
        {lat: -31.563910, lng: 147.154312, info: "some data"},
        {lat: -33.718234, lng: 150.363181, info: "some data"},
        {lat: -33.727111, lng: 150.371124, info: "some data"},
        {lat: -33.848588, lng: 151.209834, info: "some data"},
        {lat: -33.851702, lng: 151.216968, info: "some data"},
        {lat: -34.671264, lng: 150.863657, info: "some data"},
        {lat: -35.304724, lng: 148.662905, info: "some data"},
        {lat: -36.817685, lng: 175.699196, info: "some data"},
        {lat: -36.828611, lng: 175.790222, info: "some data"},
        {lat: -37.750000, lng: 145.116667, info: "some data"},
        {lat: -37.759859, lng: 145.128708, info: "some data"},
        {lat: -37.765015, lng: 145.133858, info: "some data"},
        {lat: -37.770104, lng: 145.143299, info: "some data"},
        {lat: -37.773700, lng: 145.145187, info: "some data"},
        {lat: -37.774785, lng: 145.137978, info: "some data"},
        {lat: -37.819616, lng: 144.968119, info: "some data"},
        {lat: -38.330766, lng: 144.695692, info: "some data"},
        {lat: -39.927193, lng: 175.053218, info: "some data"},
        {lat: -41.330162, lng: 174.865694, info: "some data"},
        {lat: -42.734358, lng: 147.439506, info: "some data"},
        {lat: -42.734358, lng: 147.501315, info: "some data"},
        {lat: -42.735258, lng: 147.438000, info: "some data"},
        {lat: -43.999792, lng: 170.463352, info: "some data"}
    ];

    var i;
    var markers = [];
    for(i=0;i<locations.length;i++){
        var marker = createMarker(locations[i]);
        markers.push(marker);
    }
    */



/////////////////////////////////////////////////////////////


    app.controller('MapController', function ($http, $scope) {

        var mapInfo = {};

        //function this function make request to the Open AQ Platform (measurements API)
        function getData (){
            var url = 'https://api.openaq.org/v1/measurements?limit=10000&coordinates=' + mapInfo.centerLag + ',' + mapInfo.centerLng + '&radius=' + mapInfo.radius;

            $http.get(url).success(function (data) {
                var datalist = data.results;

                var formatedArray = dataFilter(datalist);

                createMarkerCluster(formatedArray);

                $scope.datalist = formatedArray;
            });

        }

        //this function format the data in the way we need
        function dataFilter(data){

            var returnArr = [];

            for(var i=0;i<data.length;i++){
                if(checkCoordExits(data[i],returnArr)){
                    var index = checkParaExist(data[i],returnArr);
                    if(index !== -1){
                        //no need for update based on the date, because the response data is order from latest to oldest
                        //which means the first value of a parameter we get is the latest one.
                    }else{
                        returnArr[index] = updatePara(returnArr[index], data[i]);
                    }
                }else{
                    returnArr.push(formatObj(data[i]));
                }
            }

            return returnArr;
        }

        //this function check is there an object with same coordinates in the formatted array
        function checkCoordExits(obj, datalist){
            var exist = false;

            for(var i=0;i<datalist.length;i++){
                if(datalist[i].coordinates.latitude === obj.coordinates.latitude &&
                    datalist[i].coordinates.longitude === obj.coordinates.longitude
                ) {
                    exist = true;
                }
            }

            return exist;
        }

        //check if the parameter of the location exists in the formatted array
        function checkParaExist(obj, datalist) {
            var index = -1; //The index of the parameter of specific location in the dataFilter return array

            for(var i=0; i<datalist; i++){
                if(datalist[i].coordinates.latitude === obj.coordinates.latitude &&
                    datalist[i].coordinates.longitude === obj.coordinates.longitude
                ){
                    if(datalist[i].parameter === obj.parameter){
                        index = i;
                    }
                }
            }

             return i;
        }

        //check if this new object has a new parameter for a location in the formatted array
        function updatePara(existObj, objNewPara){
            for(var i=0; i<existObj.parameters.length;i++){
                if(existObj.parameters[i].name === objNewPara.paramenter){
                    newObj.parameters[i].value = obj.value;
                }
            }

            return existObj;
        }

        //this function formatting the object when we push the object to the formatted array
        function formatObj(obj){

            var newObj = {};

            newObj.parameters = [
                {
                    name: "pm25",
                    value: "x"
                },
                {
                    name: "pm10",
                    value: "x"
                },
                {
                    name: "co",
                    value: "x"
                },
                {
                    name: "bc",
                    value: "x"
                },
                {
                    name: "o3",
                    value: "x"
                },
                {
                    name: "so2",
                    value: "x"
                },
                {
                    name: "no2",
                    value: "x"
                },
            ];

            newObj.location = obj.location;

            newObj.coordinates = obj.coordinates;

            for(var i=0; i<newObj.parameters.length;i++) {
                if (newObj.parameters[i].name === obj.parameter) {
                    newObj.parameters[i].value = obj.value;
                }
            }
            return newObj;

        }

        //this function calculates the distance between 2 coordinates
        function calcDist(lat1, lon1, lat2, lon2){
            var radlat1 = Math.PI * lat1/180;
            var radlat2 = Math.PI * lat2/180;
            var radlon1 = Math.PI * lon1/180;
            var radlon2 = Math.PI * lon2/180;
            var theta = lon1-lon2;

            var radthetha = Math.PI * theta/180;
            var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radthetha);
            dist = Math.acos(dist);
            dist = dist * 180/Math.PI;
            dist = dist * 60 * 1.1515;

            return dist*1609.34; //convert from miles to meters
        }

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
            var centerObj = map.getCenter();

            var strHTML = "North East: " + ne.lat().toFixed(3) + ", " + ne.lng().toFixed(3) + "<br/>";
            strHTML += "South West: " + sw.lat().toFixed(3) + ", " + sw.lng().toFixed(3);
            $('#info')[0].innerHTML = strHTML;

            var distRadius = calcDist(centerObj.lat(), centerObj.lng(), ne.lat(), ne.lng());

            mapInfo.centerLag = centerObj.lat();
            mapInfo.centerLng = centerObj.lng();
            mapInfo.radius = distRadius;

            getData();

        });


////////////////////////////////////////////////////////////////////////////////////////////


    });


})();