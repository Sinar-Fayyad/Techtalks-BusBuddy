import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

// Leaflet + OpenStreetMap inside a WebView (works in Expo Go, no API key).
// markers: [{ id, name, lat, lng }] · tap a marker -> onSelect(id)
const HTML = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;background:#0a1560}.bb{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 13px sans-serif;color:#fff;background:linear-gradient(135deg,#00a3ff,#7a2cff 60%,#ff2bd6);border:3px solid #fff;box-shadow:0 0 14px rgba(0,229,255,.9)}.bb.sel{width:46px;height:46px;border-color:#00e5ff;font-size:16px}</style></head>
<body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map=null,layer=null,fitKey='';
function ready(){return window.L&&document.getElementById('map');}
function init(){ if(map||!ready())return; map=L.map('map').setView([33.89,35.5],9);
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map); layer=L.layerGroup().addTo(map); }
window.setMarkers=function(items,sel){ init(); if(!map)return; layer.clearLayers();
 items.forEach(function(c){var ini=(c.name||'?').split(' ').map(function(p){return p[0]}).slice(0,2).join('').toUpperCase();
  var ic=L.divIcon({className:'',html:'<div class="bb'+(c.id===sel?' sel':'')+'">'+ini+'</div>',iconSize:[40,40],iconAnchor:[20,20]});
  var m=L.marker([c.lat,c.lng],{icon:ic}).addTo(layer); m.bindTooltip(c.name,{direction:'top',offset:[0,-18]});
  m.on('click',function(){window.ReactNativeWebView.postMessage(String(c.id));});});
 var key=items.map(function(c){return c.id}).sort().join(',');
 if(items.length&&key!==fitKey){fitKey=key; if(items.length===1)map.setView([items[0].lat,items[0].lng],15); else map.fitBounds(items.map(function(c){return[c.lat,c.lng]}),{padding:[50,50],maxZoom:16});}
 if(!items.length)fitKey='';
 var s=items.filter(function(c){return c.id===sel})[0]; if(s)map.panTo([s.lat,s.lng]);};
window.addEventListener('load',init);
</script></body></html>`;

export default function MapView({ markers, selectedId, onSelect, height = 300 }) {
  const ref = useRef(null);
  const loaded = useRef(false);

  const push = () => {
    if (!ref.current || !loaded.current) return;
    ref.current.injectJavaScript(`window.setMarkers && window.setMarkers(${JSON.stringify(markers)}, ${JSON.stringify(selectedId ?? null)}); true;`);
  };
  useEffect(push, [markers, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={[st.box, { height }]}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html: HTML }}
        onLoadEnd={() => { loaded.current = true; setTimeout(push, 400); }}
        onMessage={(e) => onSelect && onSelect(Number(e.nativeEvent.data))}
        javaScriptEnabled
        style={{ backgroundColor: '#0a1560' }}
        scrollEnabled={false}
      />
    </View>
  );
}

const st = StyleSheet.create({
  box: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,229,255,0.45)', marginBottom: 12 },
});
