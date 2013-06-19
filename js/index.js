var db = openDatabase('costumediy', '1.0', 'Costume DIY', 2 * 1024 * 1024);
var domain = "http://www.costumediy.com/server/";
var opacity = 0.2;

function openFind(gender) {
	localStorage.gender = gender;
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

function closeOverlay() {
	var objects = document.getElementsByClassName('overlay');
	for (var i = 0; i < objects.length; ++i) {
		var item = objects[i];  
		item.style.display = 'none';
	}
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
	document.getElementById('find').style.display = "none";
	document.getElementById('results').style.display = "block";
	
	var colourArray = new Array();
	var garmentArray = new Array();
	
	db.transaction(function (tx) {
		tx.executeSql('SELECT * FROM rows', [], function (tx, results) {			
			for(i = 0; i < results.rows.length; i++){	
				console.log('COLOUR ID: '+results.rows.item(i).colour_id);
				colourArray.push(results.rows.item(i).colour_id);
				garmentArray.push(results.rows.item(i).garment_id);
			}
			console.log('ARRAY: '+colourArray);
			var c = colourArray.join(",");
			
			var g = garmentArray.join(",");
			var queryString = 'c='+c+'&g='+g;
			
			load(domain + 'getCostumes/m?'+queryString, function(xhr) { 
				console.log('xhr read successfully');
				
				var json = JSON.parse(xhr.responseText);
				console.log('json length = '+json.length);
				var tr = "";
				for(var i = 0; i < json.length; i++) {			
					//console.log(json[i].name);
					tr = tr + '<tr><td>'+json[i].name+'</td></tr>';
				}
				document.getElementById('results-list').innerHTML = tr;

				document.getElementById('loader').style.display = "none";
			});
		}, null);
	});
	
	
	
	return false;
}

function deleteRow(id) {
	console.log(id);
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
			console.log(len);
			var tr = "";
			document.getElementById('list').innerHTML = tr;
			console.log('done');
			for(i = 0; i < len; i++){
				console.log(results.rows.item(i));
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
	readRows();
	return false;
}

function selectGarment(garment, garment_id) {
	localStorage.garment = garment;
	localStorage.garment_id = garment_id;
	document.getElementById('colour').style.opacity = 1;
	document.getElementById('clothing').style.opacity = opacity;
	document.getElementById('pick').innerHTML = 'PLEASE CHOOSE THE COLOUR FOR YOUR '+garment;
	return false;
}

function loadColours() {
	db.transaction(function (tx) {
		tx.executeSql('SELECT * FROM colours', [], function (tx, results) {			
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
}

function loadClothing() {
	db.transaction(function (tx) {
		tx.executeSql('SELECT * FROM garments', [], function (tx, results) {			
			var len = results.rows.length, i;
			var html = "";
			for(i = 0; i < len; i++){
				html = html + '<li><a href="" onclick="return selectGarment(\''+results.rows.item(i).title+'\', \''+results.rows.item(i).id+'\');">'+results.rows.item(i).title+'</a></li>';
				document.getElementById('clothing-list').innerHTML = '<ul class="list">'+html+'</ul>';
			}
		});
	});
}

function init() {
	db.transaction(function (tx) {
		tx.executeSql('DROP TABLE IF EXISTS garments');
		tx.executeSql('CREATE TABLE garments (id INTEGER PRIMARY KEY ASC, title)');
	});
	
	load(domain + 'getGarments', function(xhr) { 
		var json = JSON.parse(xhr.responseText);
		db.transaction(function (tx) {
			for(var i = 0; i < json.length; i++) {
				title = json[i].title;
				tx.executeSql('INSERT INTO garments (title) VALUES ("'+title+'")');
			}
		});
		loadClothing();		
	});
	
	db.transaction(function (tx) {
		tx.executeSql('DROP TABLE IF EXISTS colours');
		tx.executeSql('CREATE TABLE colours (id INTEGER PRIMARY KEY ASC, title, hex, image)');
	});
		
	load(domain + 'getColours', function(xhr) { 
		var json = JSON.parse(xhr.responseText);
		db.transaction(function (tx) {
			for(var i = 0; i < json.length; i++) {
				tx.executeSql('INSERT INTO colours (title, hex) VALUES ("'+json[i].title+'", "'+json[i].hex+'")');
			}
		});
		loadColours();
	});
	
	db.transaction(function (tx) {
		tx.executeSql('DROP TABLE IF EXISTS rows');
		tx.executeSql('CREATE TABLE rows (id INTEGER PRIMARY KEY ASC, colour, colour_id, garment, garment_id)');
	});
	
	document.getElementById('results-list').innerHTML = '';
	document.getElementById('loader').style.display = "block";
}

window.onload = function(){	
	init();
	
	//localStorage.clear();
	
	document.getElementById('colour').style.opacity = opacity;
}