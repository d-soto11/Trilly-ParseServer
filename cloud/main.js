Parse.Cloud.beforeSave("Ruta", function(request, response) {
    var km = request.object.get("kmRecorridos");
    var time = request.object.get("tiempo");
    
    var velProm = (km/time)*3600 
    request.object.set("velPromedio", velProm);
    
    console.log("User ID: "+request.object.get("usuario").id)
    
    var currentUser = request.user;
    if (currentUser) {
        var peso = currentUser.get("peso");
        console.log("Calorias: "+(velProm*peso*time/1000))
        request.object.set("cal", velProm*peso*time/1000);
        response.success()
    } else {
    // show the signup or login page
        console.warn("Error con el usuraio")
    }
 
//    var query = new Parse.Query(Parse.User);
//    query.equalTo("objectId", request.object.get("usuario").id);
//    query.first({
//        success: function(object) {
//        // Successfully retrieved the object.
//            
//            
//        },
//        error: function(error) {
//        }
//    });
    

});

Parse.Cloud.afterSave("Ruta", function(request) {
    var query = new Parse.Query("Estadistica");
    query.equalTo("user", request.object.get("usuario"));
    query.first({
        success: function(object) {
        // Successfully retrieved the object.
            var km = object.get("kmRecorridos");
            var time = object.get("tiempo");
            var cal = object.get("cal");

            console.log("Encontro la estadistica y tiene "+km+"km y "+time+" segundos");
            object.set("kmRecorridos", km+request.object.get("kmRecorridos"));
            object.set("tiempo", time+request.object.get("tiempo"));
            object.set("cal", cal+request.object.get("cal"));
            object.save();
            
        },
        error: function(error) {
            console.warn("Error: " + error.code + " " + error.message);
        }
    });

});

Parse.Cloud.beforeSave("Estadistica", function(request, response) {
    var km = request.object.get("kmRecorridos");
    var time = request.object.get("tiempo");
    
    request.object.set("currentTree", (km%100));
    request.object.set("savedTrees", km/100);
    request.object.set("gas", km/45);
    request.object.set("kgCO2", km*0.15);
    request.object.set("money", (km/45)*8500);

    response.success();
});