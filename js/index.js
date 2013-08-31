var db = openDatabase('costumediy', '1.0', 'Costume DIY', 2 * 1024 * 1024);
var domain = "http://www.costumediy.com/server/";
var opacity = 0.2;

$('a').on('touchstart', function(e){
    $(this).addClass('tap');
});

$('a').on('touchend', function(e){
    $(this).removeClass('tap');
});

function showPreloader() {
	document.getElementById("preloader").style.display = "block";
}

function hidePreloader() {
	document.getElementById("preloader").style.display = "none";
}

function openFind(gender) {	
	localStorage.gender = gender;
	
	loadGarments();
	
	document.getElementById("index").style.display = "none";
	document.getElementById("find").style.display = "block";
	window.scrollTo(0,0);
	return false;
}

function closeFind() {
	document.getElementById("index").style.display = "block";
	document.getElementById("find").style.display = "none";
	window.scrollTo(0,0);
	return false;
}

function openOverlay(id) {
	document.getElementById("overlay-"+id).style.display = "block";
	return false;
}

function openColour() {
	if (localStorage.getItem("garment") !== null) {
		document.getElementById("overlay-colour").style.display = "block";
	}
	window.scrollTo(0,0);
	return false;
}

function expandCharacter(id) {
	showPreloader();
	load(domain + 'getCharacter/'+ id, function(xhr) {		
		var json = JSON.parse(xhr.responseText);
        //console.log(json);
		document.getElementById("character-title").innerHTML = json.name;
		
		var objImage = document.getElementById("character-image");
		if(json.image != '') {
			objImage.src = domain + "public/images/characters/" + json.image;
			objImage.style.display = "block";
		} else {
			objImage.style.display = "none";
		}

		var html = "";
		for(var i = 0; i < json.costumes.length; i++) {
            html = html + "<li><span id='row_"+ json.costumes[i].colour_id +"_"+ json.costumes[i].garment_id+ "'>" + json.costumes[i].colour_title + " " + json.costumes[i].garment_title + "</span></li>";
		}
        document.getElementById('garments-list').innerHTML = '<ul class="notepad-list">'+html+'</ul>';

        db.transaction(function (tx) {
            tx.executeSql('SELECT * FROM rows', [], function (tx, results) {
                for(i = 0; i < results.rows.length; i++){
                    var row = results.rows.item(i);
                    var rowID = "row_"+row['colour_id']+"_"+row['garment_id'];
                    console.log("row_"+row['colour_id']+"_"+row['garment_id']);
                    if(document.getElementById(rowID)) {
                        document.getElementById(rowID).className = "tick";
                    }
                }
            }, null);
        });

		document.getElementById("overlay-character").style.display = "block";
		hidePreloader();
	});
	return false;
}

function closeOverlay() {
	var objects = document.getElementsByClassName('overlay');
	for (var i = 0; i < objects.length; ++i) {
		var item = objects[i];  
		item.style.display = 'none';
	}
	return false;
}

function startOver() {
	localStorage.clear();
	
	init();
	readRows();
	
	document.getElementById("results").style.display = "none";
	document.getElementById("index").style.display = "block";
	return false;
}

function load(url, callback) {
	var xhr;
	if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
		xhr=new XMLHttpRequest();
	} else { // code for IE6, IE5
		xhr=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhr.onreadystatechange=function() {
		if (xhr.readyState==4 && xhr.status==200) {
			callback(xhr);			
		}
	}
	xhr.open("GET", url, true);
	xhr.send();
}

function runFind() {
	showPreloader();
	
	document.getElementById('find').style.display = "none";
	document.getElementById('results').style.display = "block";
	
	var colourArray = new Array();
	var garmentArray = new Array();
	
	db.transaction(function (tx) {
		tx.executeSql('SELECT * FROM rows', [], function (tx, results) {			
			for(i = 0; i < results.rows.length; i++){	
				//console.log('COLOUR ID: '+results.rows.item(i).colour_id);
				colourArray.push(results.rows.item(i).colour_id);
				garmentArray.push(results.rows.item(i).garment_id);
			}
			//console.log('ARRAY: '+colourArray);
			var c = colourArray.join(",");
			
			var g = garmentArray.join(",");
			var queryString = 'c='+c+'&g='+g;
			
			load(domain + 'getCostumes/'+ localStorage.gender +'?'+queryString, function(xhr) {		
				var json = JSON.parse(xhr.responseText);
				var row = "";
				for(var i = 0; i < json.length; i++) {
					var css = "";
					if(json[i].items_count >= 3) {
						//css = 'style="background:#e67c00;"';
					}
					if(json[i].items_count >= 2) {
						//css = 'style="background:#eeb545;"';
					}
				
					row = row + '<li '+css+'>';
					row = row + '<a href="" onclick="return expandCharacter('+json[i].id+');"><img src="images/expand.png" class="expand" />';
					row = row + json[i].name;
					row = row +	'<span>'+json[i].items_count+' items matched</span>';
					row = row + '</a></li>';
				}
				
				if(row == "") row = '<li style="background:#f6d331;text-align:center;padding:20px 0;">Sorry, nothing found.<br/>Please try again.</li>';
				
				document.getElementById('results-list').innerHTML = row;
				
				hidePreloader();
			});
		}, null);
	});
	
	
	
	return false;
}

function deleteRow(id) {
	//console.log(id);
	db.transaction(function (tx) {
		tx.executeSql("DELETE FROM rows WHERE id = ?", [id]);
	});
	readRows();
	return false;
}

function readRows() {
	db.transaction(function (tx) {
		tx.executeSql('SELECT * FROM rows', [], function (tx, results) {			
			var len = results.rows.length, i;
			//console.log(len);
			var tr = "";
			document.getElementById('list').innerHTML = tr;
			//console.log('done');
			for(i = 0; i < len; i++){
				//console.log(results.rows.item(i));
				tr = tr + '<tr><td>'+results.rows.item(i).colour+' '+results.rows.item(i).garment+'</td><td width="50" align="center" valign="middle"><a href="" onclick="return deleteRow('+results.rows.item(i).id+');" class="delete-btn"><img src="images/delete.png" /></a></td></tr>';
				document.getElementById('list').innerHTML = tr;
			}
		}, null);
	});
}

function selectColour(colour, colour_id) {
	garment = localStorage.garment;
	garment_id = localStorage.garment_id;
	db.transaction(function (tx) {
		tx.executeSql('INSERT INTO rows (colour, colour_id, garment, garment_id) VALUES ("'+colour+'", "'+colour_id+'", "'+garment+'", "'+garment_id+'")');
	});
	document.getElementById('clothing').style.opacity = 1;
	document.getElementById('colour').style.opacity = opacity;
	document.getElementById('pick').innerHTML = 'ADD SOME MORE - THE MORE YOU ADD, THE EASIER IT GETS!';
	document.getElementById('find-btn').style.display = 'block';
	
	localStorage.removeItem("garment");
	localStorage.removeItem("garment_id");
	
	readRows();
	
	window.scrollTo(0,0);
	return false;
}

function selectGarment(garment, garment_id) {
	showPreloader();
	
	localStorage.garment = garment;
	localStorage.garment_id = garment_id;
	
	load(domain + 'getColoursBasedOnGarment/'+ localStorage.gender +'/'+ localStorage.garment_id, function(xhr) { 
		//console.log('xhr read successfully');
		
		var json = JSON.parse(xhr.responseText);
		var html = "";
		for(var i = 0; i < json.length; i++) {			
			if(json[i].hex == "000000") color = "FFFFFF";
			else color = "000000";
			
			if(json[i].stripe != '') {
				html = html + '<li><a href="" class="stripe" style="background-image: linear-gradient(left, #'+json[i].hex+' 50%, #'+json[i].stripe+' 50%);background-image: -o-linear-gradient(left, #'+json[i].hex+' 50%, #'+json[i].stripe+' 50%);background-image: -moz-linear-gradient(left, #'+json[i].hex+' 50%, #'+json[i].stripe+' 50%);background-image: -webkit-linear-gradient(left, #'+json[i].hex+' 50%, #'+json[i].stripe+' 50%);background-image: -ms-linear-gradient(left, #'+json[i].hex+' 50%, #'+json[i].stripe+' 50%);color:#'+color+';" onclick="return selectColour(\''+json[i].title+'\', \''+json[i].id+'\');"><span>'+json[i].title+'</span></a></li>';
			} else {			
				html = html + '<li><a href="" style="background:#'+json[i].hex+';color:#'+color+';" onclick="return selectColour(\''+json[i].title+'\', \''+json[i].id+'\');"><span>'+json[i].title+'</span></a></li>';
			}
		}
		document.getElementById('colour-list').innerHTML = '<ul class="list">'+html+'</ul>';
		
		document.getElementById('colour').style.opacity = 1;
		document.getElementById('clothing').style.opacity = opacity;
		document.getElementById('pick').innerHTML = 'PLEASE CHOOSE THE COLOUR FOR YOUR '+garment;
		
		hidePreloader();
	});
	
	return false;
}

function loadColours() {
	db.transaction(function (tx) {
		tx.executeSql('DROP TABLE IF EXISTS colours');
		tx.executeSql('CREATE TABLE colours (id INTEGER PRIMARY KEY, title, hex, image)');
	});
		
	load(domain + 'getColours/' + localStorage.gender, function(xhr) { 
		var json = JSON.parse(xhr.responseText);
		db.transaction(function (tx) {
			for(var i = 0; i < json.length; i++) {
				tx.executeSql('INSERT INTO colours (id, title, hex) VALUES ("'+json[i].id+'", "'+json[i].title+'", "'+json[i].hex+'")');
			}
		});
		
		db.transaction(function (tx) {
			tx.executeSql('SELECT * FROM colours ORDER BY title ASC', [], function (tx, results) {			
				var len = results.rows.length, i;
				var html = "";
				for(i = 0; i < len; i++){
					if(results.rows.item(i).hex == "000000") color = "FFFFFF";
					else color = "000000";
					html = html + '<li><a href="" style="background:#'+results.rows.item(i).hex+';color:#'+color+';" onclick="return selectColour(\''+results.rows.item(i).title+'\', \''+results.rows.item(i).id+'\');"><span>'+results.rows.item(i).title+'</span></a></li>';
					document.getElementById('colour-list').innerHTML = '<ul class="list">'+html+'</ul>';
				}
			});
		});
	});	
}

function loadGarments() {
	showPreloader();
	
	db.transaction(function (tx) {
		tx.executeSql('DROP TABLE IF EXISTS garments');
		tx.executeSql('CREATE TABLE garments (id INTEGER PRIMARY KEY, title)');
	});
	
	load(domain + 'getGarments/' + localStorage.gender, function(xhr) { 
		var json = JSON.parse(xhr.responseText);
		db.transaction(function (tx) {
			for(var i = 0; i < json.length; i++) {
				tx.executeSql('INSERT INTO garments (id, title) VALUES ("'+json[i].id+'", "'+json[i].title+'")');
			}
		});
		
		db.transaction(function (tx) {
			tx.executeSql('SELECT * FROM garments ORDER BY title ASC', [], function (tx, results) {			
				var len = results.rows.length, i;
				var html = "";
				for(i = 0; i < len; i++){
					html = html + '<li><a href="" onclick="return selectGarment(\''+results.rows.item(i).title+'\', \''+results.rows.item(i).id+'\');">'+results.rows.item(i).title+'</a></li>';
					document.getElementById('clothing-list').innerHTML = '<ul class="list">'+html+'</ul>';
				}
			});
		});
		
		hidePreloader();		
	});
}

function init() {
	db.transaction(function (tx) {
		tx.executeSql('DROP TABLE IF EXISTS rows');
		tx.executeSql('CREATE TABLE rows (id INTEGER PRIMARY KEY ASC, colour, colour_id, garment, garment_id)');
	});
	
	document.getElementById('results-list').innerHTML = '';
	document.getElementById('find-btn').style.display = "none";
}

window.onload = function(){	
	init();

    //localStorage.clear();
	
	document.getElementById('colour').style.opacity = opacity;
}