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

    var markers = [];

    function createMarker(infoObj) {
        var latLng = {
            lat: infoObj.coordinates.latitude,
            lng: infoObj.coordinates.longitude
        }

        var marker = new google.maps.Marker({
            position: latLng,
            map: map,
        });

        var infoStr = "";
        infoStr += infoObj.location + '<br/>';

        for (var i = 0; i < infoObj.parameters.length; i++) {
            if (infoObj.parameters[i].value !== "x") {
                infoStr += '- ' + infoObj.parameters[i].name + " is " + infoObj.parameters[i].value + "µg/m3"
            }
        }

        var infoWindow = new google.maps.InfoWindow({
            content: infoStr
        });

        google.maps.event.addListener(marker, "mouseover", function () {
            infoWindow.open(map, marker);
        });

        google.maps.event.addListener(marker, 'mouseout', function () {
            infoWindow.close();
        });

        return marker;
    }

///////////////////////////////////////////////////////////////

////marker cluster

    ////here is just example for marker cluster
    function createMarkerCluster(){
        var markerCluster = new MarkerClusterer(map, markers,
            {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
    }

    function removeMarkers(){


        for(var i=0; i<markers.length;i++){
            markers[i].setMap(null);
        }
        markers = [];
    }




/////////////////////////////////////////////////////////////


    app.controller('MapController', function ($http, $scope) {
        //store the sorting request
        this.sortRequest = {};

        this.requestLoca = {};

        var mapInfo = {};

        //function this function make request to the Open AQ Platform (measurements API)
        function getData(){
            var url = 'https://api.openaq.org/v1/measurements?limit=10000&coordinates=' + mapInfo.centerLag + ',' + mapInfo.centerLng + '&radius=' + mapInfo.radius;

            $http.get(url).success(function (data) {
                var datalist = data.results;
                var formattedArray = dataFilter(datalist);

                removeMarkers();

                for(var i=0;i<formattedArray.length;i++){
                    var marker = createMarker(formattedArray[i]);
                    markers.push(marker);
                }

                createMarkerCluster();

                $scope.datalist = formattedArray;
            });

        }

        //sorting based by measurements
        this.onlyShow = function(){
            var request = this.sortRequest;

            var url = 'https://api.openaq.org/v1/measurements?limit=10000&coordinates=' + mapInfo.centerLag + ',' + mapInfo.centerLng + '&radius=' + mapInfo.radius;


            $http.get(url).success(function (data) {
                var datalist = data.results;
                var formattedArray = dataFilter(datalist);
                var validList = [];
                var i;

                if(request.operator === "largerequal"){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[request.type].value !== "x"){
                            if(formattedArray[i].parameters[request.type].value >= request.value){
                                validList.push(formattedArray[i]);
                            }
                        }
                    }

                }else if(request.operator === "lessequal"){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[request.type].value !== "x"){
                            if(formattedArray[i].parameters[request.type].value <= request.value){
                                validList.push(formattedArray[i]);
                            }
                        }
                    }

                }else{
                    window.alert('something went wrong');
                }
                console.log(validList);
                $scope.datalist = validList;
            });


        };

        //sorting by parameters
        // 1 = pm2.5 increasing
        // 2 = pm2.5 decreasing
        // 3 = pm10 increasing
        // 4 = pm10 decreasing
        // 5 = co increasing
        // 6 = co decreasing
        // 7 = bc increasing
        // 8 = bc decreasing
        // 9 = o3 increasing
        // 10 = o3 decreasing
        // 11 = so2 increasing
        // 12 = so2 decreasing
        // 13 = no2 increasing
        // 14 = no2 decreasing

        this.sortList = function(num){
            var url = 'https://api.openaq.org/v1/measurements?limit=10000&coordinates=' + mapInfo.centerLag + ',' + mapInfo.centerLng + '&radius=' + mapInfo.radius;
            $http.get(url).success(function (data) {
                var datalist = data.results;
                var formattedArray = dataFilter(datalist);

                var sortList = [];
                var xList = [];
                var validList = [];
                var i;

                if(num === 1){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[0].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[0].value < b.parameters[0].value){
                            return -1;
                        }else{
                            return 1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 2){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[0].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[0].value < b.parameters[0].value){
                            return 1;
                        }else{
                            return -1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 3){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[1].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[1].value < b.parameters[1].value){
                            return -1;
                        }else{
                            return 1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 4){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[1].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[1].value < b.parameters[1].value){
                            return 1;
                        }else{
                            return -1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 5){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[2].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[2].value < b.parameters[2].value){
                            return -1;
                        }else{
                            return 1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 6){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[2].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[2].value < b.parameters[2].value){
                            return 1;
                        }else{
                            return -1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 7){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[3].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[3].value < b.parameters[3].value){
                            return -1;
                        }else{
                            return 1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 8){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[3].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[3].value < b.parameters[3].value){
                            return 1;
                        }else{
                            return -1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 9){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[4].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[4].value < b.parameters[4].value){
                            return -1;
                        }else{
                            return 1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 10){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[4].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[4].value < b.parameters[4].value){
                            return 1;
                        }else{
                            return -1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 11){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[5].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[5].value < b.parameters[5].value){
                            return -1;
                        }else{
                            return 1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 12){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[5].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[5].value < b.parameters[5].value){
                            return 1;
                        }else{
                            return -1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 13){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[6].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[6].value < b.parameters[6].value){
                            return -1;
                        }else{
                            return 1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else if (num === 14){
                    for(i=0;i<formattedArray.length;i++){
                        if(formattedArray[i].parameters[6].value === 'x'){
                            xList.push(formattedArray[i]);
                        }else{
                            validList.push(formattedArray[i]);
                        }
                    }

                    validList.sort(function (a,b) {
                        if(a.parameters[6].value < b.parameters[6].value){
                            return 1;
                        }else{
                            return -1;
                        }
                    });

                    sortList = validList.concat(xList);
                }else{
                    window.alert('something went wrong, please refresh the page');
                    console.log(num);
                }


                $scope.datalist = sortList;
            })
        };

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