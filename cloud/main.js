Parse.Cloud.beforeSave("Ruta", function (request, response) {
    var km = request.object.get("kmRecorridos");
    var time = request.object.get("tiempo");
    
    var velProm = (km /time)*3600 
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
            
            var gruposUsuario = request.user.relation("grupos");
                var gruposQuery = gruposUsuario.query();
                        
                gruposQuery.find({
                    success: function(results){
                        for (var j=0;j<results.length; j++){
                            var grupo = results[j];
                            grupo.increment("kmRecorridos", km);
                            grupo.save();
                        }
                    },
                    error: function(error){
                        console.warn("Error: "+error.code+" "+error.message);
                    }
                });
            
        },
        error: function(error) {
            console.warn("Error: " + error.code + " " + error.message);
        }
    });

});

Parse.Cloud.beforeSave("Estadistica", function(request, response) {
    var km = request.object.get("kmRecorridos");
    var time = request.object.get("tiempo");
    var KMS = parseInt(""+process.env.KM_FOR_TREE, 10);
    console.log("Constante!: "+KMS);
    request.object.set("currentTree", ((km%KMS)/KMS)*100);
    request.object.set("savedTrees", km/KMS);
    request.object.set("gas", km/45);
    request.object.set("kgCO2", km*0.15);
    request.object.set("money", (km/45)*8500);

    response.success();
});

Parse.Cloud.afterSave("Grupo", function(request) {
    var KMS = parseInt(""+process.env.KM_FOR_TREE, 10);
    var km = request.object.get("kmRecorridos");
    request.object.set("savedTrees", km/KMS);
    request.object.set("kgCO2", km*0.15);
    response.success();
});

Parse.Cloud.define("checkUserTree", function(request, response) {
    var kmRecorridos = request.km;
    var KMS = parseInt(""+process.env.KM_FOR_TREE, 10);
    var query = new Parse.Query("Estadistica");
    query.equalTo("user", request.user);
    query.first({
        success: function(object) {
        // Successfully retrieved the object.
            var km = object.get("kmRecorridos");
            if (km-kmRecorridos > KMS){
                var empresas = new Parse.Query("Empresa");
                empresas.greaterThan("arbolesDisponibles", 0)
                empresas.find({
                    success: function(results){
                        var random = Math.random()*results.length;
                        var i = parseInt(random, 10);
                        var empresaDonante = results[i];
                        var nombre = empresaDonante.get("nombre");
                        empresaDonante.increment("arbolesDisponibles", -1);
                        empresaDonante.increment("arbolesRegalados");
                        empresaDonante.save();
                        
                        var res = {"result": {"kilometers":km,
                                                "empresa":nombre
                                                }
                                      };
                    
                        response.success(res);
                       
                    },
                    error: function(error){
                        console.warn("Error trees: "+error.code+" "+error.message);
                        response.error();
                    }
                });
                
            }
            
        },
        error: function(error) {
            console.warn("Error trees: " + error.code + " " + error.message);
            response.error();
        }
    });
});