/*
	Leaflet.print, implements the Mapfish print protocol allowing a Leaflet map to be printed using either the Mapfish or GeoServer print module.
	(c) 2013, Adam Ratcliffe, GeoSmart Maps Limited
*/
!function(t,i){L.print=L.print||{},L.print.Provider=L.Class.extend({includes:L.Mixin.Events,statics:{MAX_RESOLUTION:156543.03390625,MAX_EXTENT:[-20037508.34,-20037508.34,20037508.34,20037508.34],SRS:"EPSG:3857",INCHES_PER_METER:39.3701,DPI:72,UNITS:"m"},options:{autoLoad:!1,outputFormat:"pdf",outputFilename:"leaflet-map",method:"POST",rotation:0,customParams:{}},initialize:function(t){if(L.version<="0.5.1")throw"Leaflet.print requires Leaflet 0.6.0+. Download latest from https://github.com/Leaflet/Leaflet/";var i;t=L.setOptions(this,t),t.map&&this.setMap(t.map),t.capabilities?this._capabilities=t.capabilities:this.options.autoLoad&&this.loadCapabilities(),t.listeners&&(t.listeners.context&&(i=t.listeners.context,delete t.listeners.context),this.addEventListener(t.listeners,i))},loadCapabilities:function(){if(this.options.url){var t;t=this.options.url+"/info.json",this.options.proxy&&(t=this.options.proxy+t),$.ajax({type:"GET",dataType:"json",url:t,success:$.proxy(this.onCapabilitiesLoad,this)})}},print:function(i){i=L.extend(L.extend({},this.options),i),this.fire("beforeprint",{provider:this,map:this._map});var e,o=JSON.stringify(L.extend({units:L.print.Provider.UNITS,srs:L.print.Provider.SRS,layout:i.layout,dpi:i.dpi,outputFormat:i.outputFormat,outputFilename:i.outputFilename,layers:this._encodeLayers(this._map._layers),pages:[{center:this._projectCoords(L.print.Provider.SRS,this._map.getCenter()),scale:this._getScale(),rotation:i.rotation}]},this.options.customParams));"GET"===i.method?(e=this._capabilities.printURL+"?spec="+encodeURIComponent(o),i.proxy&&(e=i.proxy+encodeURIComponent(e)),t.open(e),this.fire("print",{provider:this,map:this._map})):(e=this._capabilities.createURL,i.proxy&&(e=i.proxy+e),$.ajax({type:"POST",dataType:"json",url:e,data:o,success:$.proxy(this.onPrintSuccess,this),error:$.proxy(this.onPrintError,this)}))},getCapabilities:function(){return this._capabilities},setMap:function(t){this._map=t},setDpi:function(t){var i=this.options.dpi;i!==t&&(this.options.dpi=t,this.fire("dpichange",{provider:this,dpi:t}))},setLayout:function(t){var i=this.options.layout;i!==t&&(this.options.layout=t,this.fire("layoutchange",{provider:this,layout:t}))},setRotation:function(t){var i=this.options.rotation;i!==this.options.rotation&&(this.options.rotation=t,this.fire("rotationchange",{provider:this,rotation:t}))},_getScale:function(){for(var t,i,e=this._map,o=e.getBounds(),s=1e3*L.print.Provider.INCHES_PER_METER,n=this._capabilities.scales,r=o.getSouthWest(),a=o.getNorthEast(),l=(r.lat+a.lat)/2,p=L.latLng(l,r.lng),c=L.latLng(l,a.lng),h=p.distanceTo(c),u=e.getSize().x,d=h/u/1e3,f=(d||1e-6)*s*L.print.Provider.DPI,_=Number.POSITIVE_INFINITY,y=n.length;y--;)t=Math.abs(f-n[y].value),_>t&&(_=t,i=parseInt(n[y].value,10));return i},_getLayoutByName:function(t){var i,e,o;for(e=0,o=this._capabilities.layouts.length;o>e;e++)if(this._capabilities.layouts[e].name===t){i=this._capabilities.layouts[e];break}return i},_encodeLayers:function(t){var i,e,o=[],s=[];for(e in t)if(t.hasOwnProperty(e))if(i=t[e],i instanceof L.TileLayer.WMS)o.push(this._encoders.layers.tilelayerwms.call(this,i));else if(i instanceof L.TileLayer)o.push(this._encoders.layers.tilelayer.call(this,i));else if(i instanceof L.ImageOverlay)o.push(this._encoders.layers.image.call(this,i));else if(i instanceof L.Marker)s.push(i);else if(i instanceof L.Path&&i.toGeoJSON)s.push(i);else{if(!i._layers)continue;o.concat(this._encodeLayers(i._layers))}return s.length&&o.push(this._encoders.layers.vector.call(this,s)),o},_encoders:{layers:{httprequest:function(t){var i=t._url;return-1!==i.indexOf("{s}")&&(i=i.replace("{s}",t.options.subdomains[0])),i=this._getAbsoluteUrl(i),{baseURL:i,opacity:t.options.opacity}},tilelayer:function(t){var i,e=this._encoders.layers.httprequest.call(this,t),o=t._url.substring(0,t._url.indexOf("{z}")),s=[];for(-1!==o.indexOf("{s}")&&(o=o.replace("{s}",t.options.subdomains[0])),i=0;i<=t.options.maxZoom;++i)s.push(L.print.Provider.MAX_RESOLUTION/Math.pow(2,i));return L.extend(e,{type:"OSM",baseURL:o,extension:"png",tileSize:[t.options.tileSize,t.options.tileSize],maxExtent:L.print.Provider.MAX_EXTENT,resolutions:s,singleTile:!1})},tilelayerwms:function(t){var i,e=this._encoders.layers.httprequest.call(this,t),o=t.options;L.extend(e,{type:"WMS",layers:[o.layers].join(",").split(","),format:o.format,styles:[o.styles].join(",").split(","),singleTile:!0});for(i in t.wmsParams)t.wmsParams.hasOwnProperty(i)&&-1==="detectretina,format,height,layers,request,service,srs,styles,version,width".indexOf(i.toLowerCase())&&(e.customParams||(e.customParams={}),e.customParams[i]=t.wmsParams[i]);return e},image:function(t){return{type:"Image",opacity:t.options.opacity,name:"image",baseURL:this._getAbsoluteUrl(t._url),extent:this._projectBounds(L.print.Provider.SRS,t._bounds)}},vector:function(t){var i,e,o,s,n,r,a,l,p=[],c={},h={},u={},d=1;for(a=0,l=t.length;l>a;a++){if(e=t[a],e instanceof L.Marker){var f=e.options.icon,_=f.options.iconUrl||L.Icon.Default.imagePath+"/marker-icon.png",y=f.options.iconSize,m=f.options.iconAnchor,v=this.options.dpi/L.print.Provider.DPI;o={externalGraphic:this._getAbsoluteUrl(_),graphicWidth:y[0]/v,graphicHeight:y[1]/v,graphicXOffset:-m[0]/v,graphicYOffset:-m[1]/v}}else o=this._extractFeatureStyle(e);s=JSON.stringify(o),h=u[s],h?n=h:(u[s]=n=d++,c[n]=o),r=e.toGeoJSON(),r.geometry.coordinates=this._projectCoords(L.print.Provider.SRS,r.geometry.coordinates),r.properties._leaflet_style=n,null===i&&(i=e.options.opacity||1),p.push(r)}return{type:"Vector",styles:c,opacity:i,styleProperty:"_leaflet_style",geoJson:{type:"FeatureCollection",features:p}}}}},_extractFeatureStyle:function(t){var i=t.options;return{stroke:i.stroke,strokeColor:i.color,strokeWidth:i.weight,strokeOpacity:i.opacity,strokeLinecap:"round",fill:i.fill,fillColor:i.fillColor||i.color,fillOpacity:i.fillOpacity}},_getAbsoluteUrl:function(t){var e;return L.Browser.ie?(e=i.createElement('<a href="'+t+'"/>'),e.style.display="none",i.body.appendChild(e),e.href=e.href,i.body.removeChild(e)):(e=i.createElement("a"),e.href=t),e.href},_projectBounds:function(t,i){var e=i.getSouthWest(),o=i.getNorthEast();return this._projectCoords(t,e).concat(this._projectCoords(t,o))},_projectCoords:function(t,i){var e=t.toUpperCase().replace(":",""),o=L.CRS[e];if(!o)throw"Unsupported coordinate reference system: "+t;return this._project(o,i)},_project:function(t,i){var e,o,s,n;if("number"==typeof i[0]&&(i=new L.LatLng(i[1],i[0])),i instanceof L.LatLng)return o=t.project(i),[o.x,o.y];for(e=[],s=0,n=i.length;n>s;s++)e.push(this._project(t,i[s]));return e},onCapabilitiesLoad:function(t){this._capabilities=t,this.options.layout||(this.options.layout=this._capabilities.layouts[0].name),this.options.dpi||(this.options.dpi=this._capabilities.dpis[0].value),this.fire("capabilitiesload",{provider:this,capabilities:this._capabilities})},onPrintSuccess:function(i){var e=i.getURL+(L.Browser.ie?"?inline=true":"");L.Browser.ie?t.open(e):t.location.href=e,this.fire("print",{provider:this,response:i})},onPrintError:function(t){this.fire("printexception",{provider:this,response:t})}}),L.print.provider=function(t){return new L.print.Provider(t)},L.Control.Print=L.Control.extend({options:{position:"topleft",showLayouts:!0},initialize:function(t){L.Control.prototype.initialize.call(this,t),this._actionButtons={},this._actionsVisible=!1,this._provider=this.options.provider&&this.options.provider instanceof L.print.Provider?this.options.provider:L.print.Provider(this.options.provider||{})},onAdd:function(t){var i,e,o=L.DomUtil.create("div","leaflet-control-print"),s=L.DomUtil.create("div","leaflet-bar",o);return this._toolbarContainer=s,e=L.DomUtil.create("a","leaflet-print-print",s),e.href="#",e.title="Print map",L.DomEvent.on(e,"click",L.DomEvent.stopPropagation).on(e,"mousedown",L.DomEvent.stopPropagation).on(e,"dblclick",L.DomEvent.stopPropagation).on(e,"click",L.DomEvent.preventDefault).on(e,"click",this.onPrint,this),this.options.showLayouts&&(i=this._provider.getCapabilities(),i?this._createActions(o,i):this._provider.once("capabilitiesload",this.onCapabilitiesLoad,this)),this._provider.setMap(t),o},onRemove:function(){var t,i;for(t in this._actionButtons)this._actionButtons.hasOwnProperty(t)&&(i=this._actionButtons[t],this._disposeButton(i.button,i.callback,i.scope));this._actionButtons={},this._actionsContainer=null},getProvider:function(){return this._provider},_createActions:function(t,i){var e,o,s,n=i.layouts,r=n.length,a=L.DomUtil.create("ul","leaflet-print-actions",t),l=100,p=r*l+(r-1);for(a.style.width=p+"px",s=0;r>s;s++)o=L.DomUtil.create("li","",a),e=this._createButton({title:"Print map using the "+n[s].name+" layout",text:this._ellipsis(n[s].name,16),container:o,callback:this.onActionClick,context:this}),this._actionButtons[L.stamp(e)]={name:n[s].name,button:e,callback:this.onActionClick,context:this};this._actionsContainer=a},_createButton:function(t){var i=L.DomUtil.create("a",t.className||"",t.container);return i.href="#",t.text&&(i.innerHTML=t.text),t.title&&(i.title=t.title),L.DomEvent.on(i,"click",L.DomEvent.stopPropagation).on(i,"mousedown",L.DomEvent.stopPropagation).on(i,"dblclick",L.DomEvent.stopPropagation).on(i,"click",L.DomEvent.preventDefault).on(i,"click",t.callback,t.context),i},_showActionsToolbar:function(){L.DomUtil.addClass(this._toolbarContainer,"leaflet-print-actions-visible"),this._actionsContainer.style.display="block",this._actionsVisible=!0},_hideActionsToolbar:function(){this._actionsContainer.style.display="none",L.DomUtil.removeClass(this._toolbarContainer,"leaflet-print-actions-visible"),this._actionsVisible=!1},_ellipsis:function(t,i){return t&&t.length>i&&(t=t.substr(0,i-3)+"..."),t},onCapabilitiesLoad:function(t){this._createActions(this._container,t.capabilities)},onActionClick:function(t){var i,e,o=""+L.stamp(t.target);for(e in this._actionButtons)if(this._actionButtons.hasOwnProperty(e)&&e===o){i=this._actionButtons[e],this._provider.print({layout:i.name});break}this._hideActionsToolbar()},onPrint:function(){this.options.showLayouts?this._actionsVisible?this._hideActionsToolbar():this._showActionsToolbar():this._provider.print()}}),L.control.print=function(t){return new L.Control.Print(t)}}(this,document);