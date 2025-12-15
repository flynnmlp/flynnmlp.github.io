"use strict";
// ex:ts=2:et:

// API url: https://derpibooru.org/api/v1/json/images/2743903
var imageSource = "https://derpicdn.net/img/view/2021/11/13/2743903.png";
var imageSize = [4500, 2257];

var bounds = [[0, 0], [imageSize[1], imageSize[0]]];

var map;
var entry;
var checkboxFuzzy;
var results;
var locations;
var permalinkTimer;

function ll2xy(latlng) {
  let p = map.project(latlng, 0);
  return L.point(Math.round(p.x), Math.round(p.y + imageSize[1]));
}

function xy2ll(point) {
  point = L.point(point);
  let p = L.point(point.x, point.y - imageSize[1]);
  return map.unproject(p, 0);
}

function getLink(values, searchBase) {
  let params = new URLSearchParams(searchBase || location.search);
  for(let key in values) {
    params.set(key, values[key]);
  }
  
  let a = document.createElement("a");
  a.href = location.href;
  a.search = params;
  return a.href;
}

function onClick(event) {
  let pixel = ll2xy(event.latlng);
  
  if(pixel.x < 0 || pixel.y < 0 || pixel.x > imageSize[0] || pixel.y > imageSize[1])
    return;
  
  let href = getLink({
    x: pixel.x,
    y: pixel.y,
    z: 2,
  });
  
  let link = document.createElement("a");
  link.href = href;
  link.text = pixel.x + ", " + pixel.y;
  
  map.openPopup(link, event.latlng);
}

function onMove(event) {
  clearTimeout(permalinkTimer);
  permalinkTimer = setTimeout(updatePermalink, 500);
}

function updatePermalink() {
  let pixel = ll2xy(map.getCenter());
  
  if(isNaN(map.getZoom())) {
    debugger;
  }
  
  let href = getLink({
    x: pixel.x,
    y: pixel.y,
    z: map.getZoom(),
  });
  
  history.replaceState(href, null, href);
}

class Location {
  constructor(item) {
    this.sourceElement = item;
    
    this.x = +item.getAttribute("x");
    this.y = +item.getAttribute("y");
    this.w = +item.getAttribute("width");
    this.h = +item.getAttribute("height");
    this.label = item.getAttribute("inkscape:label");
    
    this.element = document.createElement("li");
    this.link = this.element.appendChild(document.createElement("a"));
    this.link.textContent = this.label;
    this.link.href = getLink({
      x: this.x + this.w / 2,
      y: this.y + this.h / 2,
      z: 2,
    });
    
    this.link.addEventListener("click", e => this.onClick(e));
  }
  
  onClick(event) {
    map.fitBounds(L.latLngBounds(
      xy2ll([this.x, this.y]),
      xy2ll([this.x + this.w, this.y + this.h]),
    ), {maxZoom: 1.5});
    
    event.preventDefault();
    return false;
  }
}

async function loadItems() {
  const response = await fetch("locations.svg");
  if (!response.ok)
      throw response;
  
  const xmlText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  locations = [];
  for(let item of xmlDoc.getElementById("items").children) {
    if(item.nodeName != "rect")
      continue;
    
    locations.push(new Location(item));
  }
  
  locations.sort((a, b) => a.label.localeCompare(b.label));
  
  entry = document.getElementById("entry");
  entry.addEventListener("input", filterLocations);
  document.getElementById("result_clear").addEventListener("click", e => {
    entry.value = "";
    filterLocations();
    entry.focus();
  });
  checkboxFuzzy = document.getElementById("fuzzy_search");
  checkboxFuzzy.addEventListener("change", filterLocations);
  filterLocations();
  
  document.forms[0].addEventListener("submit", e => {
    e.preventDefault();
    return false;
  });
}

String.prototype.fuzzy = function (s) {
    var hay = this.toLowerCase(), i = 0, n = -1, l;
    s = s.toLowerCase();
    for (; l = s[i++] ;) if (!~(n = hay.indexOf(l, n + 1))) return false;
    return true;
};

function filterLocations() {
  let searchText = entry.value.toLowerCase();
  results.innerHTML = "";
  
  let match = checkboxFuzzy.checked ?
    hay => hay.fuzzy(searchText) :
    hay => hay.toLowerCase().includes(searchText);
  
  for(let location of locations) {
    if(match(location.label))
      results.appendChild(location.element);
  }
  
  let num_results = results.childElementCount.toString();
  while(num_results.length < locations.length.toString().length)
    num_results = "\u2007" + num_results;
  
  if(searchText) {
    result_count.textContent = `${num_results} result(s)`;
    results.classList.remove("empty");
  } else {
    result_count.textContent = `${num_results} locations`;
    results.classList.add("empty");
  }
}

addEventListener("load", () => {
  map = L.map('map', {
    crs: L.CRS.Simple,
    zoomSnap: 0.25,
    zoomDelta: 1,
    minZoom: -3,
    maxZoom: 3,
    maxBoundsViscosity: 1,
  });
  map.setMaxBounds([
    xy2ll({x: 0, y: 0}),
    xy2ll({x: imageSize[0], y: imageSize[1]}),
  ]);
  
  map.on("click", onClick);
  map.on("move", onMove);
  
  var image = L.imageOverlay(imageSource, bounds, {
    attribution: "Map Image by <a href='https://derpibooru.org/images/2743903'>BootsDotEXE</a>",
  }).addTo(map);
  map.fitBounds(bounds);
  
  let params = new URLSearchParams(location.search);
  if(params.has("z")) {
    let z = +params.get("z");
    if(!isNaN(z))
      map.setZoom(z, {animate: false});
  }
  if(params.has("x") && params.has("y"))
    map.setView(xy2ll([+params.get("x"), +params.get("y")], {animate: false}));
  
  onMove();
  
  results = document.getElementById("results");
  loadItems().catch(console.error);
});
