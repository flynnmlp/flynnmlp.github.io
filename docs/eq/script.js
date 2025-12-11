"use strict";

// API url: https://derpibooru.org/api/v1/json/images/2743903
const imageSource = "https://derpicdn.net/img/view/2021/11/13/2743903.png";
const imageSize = [4500, 2257];

const bounds = [[0, 0], imageSize.reverse()];

var map;
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

function onClick(event) {
  let pixel = ll2xy(event.latlng);
  
  let params = new URLSearchParams(location.search);
  params.set("x", pixel.x);
  params.set("y", pixel.y);
  params.set("z", 2);
  
  let link = document.createElement("a");
  link.href = location.href;
  link.search = params;
  link.text = pixel.x + ", " + pixel.y;
  
  map.openPopup(link, event.latlng);
}

function onMove(event) {
  clearTimeout(permalinkTimer);
  permalinkTimer = setTimeout(updatePermalink, 500);
}

function updatePermalink() {
  let pixel = ll2xy(map.getCenter());
  
  let params = new URLSearchParams(location.search);
  params.set("x", pixel.x);
  params.set("y", pixel.y);
  params.set("z", map.getZoom());
  
  let a = document.createElement("a");
  a.href = location.href;
  a.search = params;
  
  history.replaceState(a.href, null, a.href);
}

addEventListener("load", () => {
  map = L.map('map', {
    crs: L.CRS.Simple,
    zoomSnap: 0.25,
    zoomDelta: 1,
    minZoom: -3,
    maxZoom: 3,
  });
  
  map.on("click", onClick);
  map.on("move", onMove);
  
  var image = L.imageOverlay(imageSource, bounds, {
    attribution: "Map Image by <a href='https://derpibooru.org/images/2743903'>BootsDotEXE</a>",
  }).addTo(map);
  map.fitBounds(bounds);
  
  let params = new URLSearchParams(location.search);
  
  if(params.has("z"))
    map.setZoom(+params.get("z"), {animate: false});
  if(params.has("x") && params.has("y"))
    map.setView(xy2ll([+params.get("x"), +params.get("y")], {animate: false}));
  
  onMove();
});
