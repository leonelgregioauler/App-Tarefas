var deviceReadyDeferred = $.Deferred();
var jqmReadyDeferred = $.Deferred();
var db = null;

$(document).on("deviceready", function() {
  deviceReadyDeferred.resolve();
});

$(document).on("mobileinit", function () {
  jqmReadyDeferred.resolve();
});

$.when(deviceReadyDeferred, jqmReadyDeferred).then(init);

function init() {
  dbInit();
}

function dbInit(){
    if (!window.indexedDB) 
        window.alert("Banco de dados incompatível");
    else{
        var request = window.indexedDB.open("taskerdb");
        request.onupgradeneeded = function() {
            console.log("newDB");
            var newDB = request.result;
            var store = newDB.createObjectStore("todo", {keyPath: "id",autoIncrement : true});
            var title = store.createIndex("title", "title", {unique: true});
            var status = store.createIndex("status", "status");
        }
        request.onsuccess = function (e) {
            console.log("openDB");
            db = e.target.result;
            refreshTasks();
        };
    }
}

function btnAddTask_click(){
    console.log("btnAddTask_click");

    var tx = db.transaction(["todo"], "readwrite");
    var store = tx.objectStore("todo");
    var task = {title:$("#title").val(),status:0}
    var request = store.add(task);

    request.onsuccess = function (e) {
        console.log("adicionado " + JSON.stringify(task));
        $("#title").val("");
        $("#_tasksPage").trigger("click");
        refreshTasks();
    };

    request.onerror = function (e) {
        console.log("Erro:", e.target.error.name);
    };

}


function refreshTasks(){
    console.log("refreshTasks");

    $("#listTasks").empty();

    var tx = db.transaction(["todo"], "readonly");
    var objectStore = tx.objectStore("todo");
    var index = objectStore.index("status");
    var cursor = index.openCursor(IDBKeyRange.only(0));

    cursor.onsuccess = function () {
        var row = cursor.result;
        if (row) {
            task = row.value;
            $("#listTasks").append("<li data-id='"+task.id+"'>"+task.title+"</li>");
            row.continue();
        }

        $("#listTasks").listview('refresh');

     // "deletar" a tarefa
     $("#listTasks").on("swiperight",">li",function(event){
      var li = $(this);
      var span = li.children();
      var idTask = $(this).attr("data-id");
      $(this).animate({marginLeft: parseInt($(this).css('marginLeft'),10) === 0 ? $(this).outerWidth() : 0 }).fadeOut('fast',function(){li.remove();changeStatus(idTask);});
  });
 };
}

function changeStatus(idTask){
    console.log("changeStatus: " + idTask);
    var tx = db.transaction(["todo"], "readwrite");
    var store = tx.objectStore("todo");
    var request = store.get(Number(idTask));
    request.onsuccess = function(e) {
        var todo = e.target.result;
        todo.status = 1;
        store.put(todo);
    }
}

