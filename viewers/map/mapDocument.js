/**
* mapDocument.js - working with map document and dependent record types
* 
* loads list of map documents and theirs content (layers and datasources), 
* opens map document - creates mapLayers
*
* @package     Heurist academic knowledge management system
* @link        http://HeuristNetwork.org
* @copyright   (C) 2005-2019 University of Sydney
* @author      Artem Osmakov   <artem.osmakov@sydney.edu.au>
* @author      Ian Johnson     <ian.johnson@sydney.edu.au>
* @license     http://www.gnu.org/licenses/gpl-3.0.txt GNU License 3.0
* @version     4
*/

/*
* Licensed under the GNU License, Version 3.0 (the "License"); you may not use this file except in compliance
* with the License. You may obtain a copy of the License at http://www.gnu.org/licenses/gpl-3.0.txt
* Unless required by applicable law or agreed to in writing, software distributed under the License is
* distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied
* See the License for the specific language governing permissions and limitations under the License.
*/

function hMapDocument( _options )
{    
    var _className = "MapDocument",
    _version   = "0.4";

    // default options
    options = {
        container:null,  //@todo all ui via mapcontrol
        mapwidget:null, 
    },
    
    RT_MAP_DOCUMENT = 0,
    RT_MAP_LAYER = 0,
    DT_DATA_SOURCE = 0,
    RT_QUERY_SOURCE = 0,
    DT_QUERY_STRING = 0,
    DT_SYMBOLOGY = 0, //@todo rename to DT_SYMBOLOGY
    
    map_documents = null, //recordset - all loaded documents
    map_documents_content = {}, //mapdoc_id=>recordset with all layers and datasources of document
    //map_documents_layers = {};  //native map layers
    _uniqueid = 1;   
    
    // Any time the widget is called with no arguments or with only an option hash, 
    // the widget is initialized; this includes when the widget is created.
    function _init(_options) {
        
        options = $.extend(options, _options);
        
        options.container = $(options.container);
        
        RT_MAP_DOCUMENT = window.hWin.HAPI4.sysinfo['dbconst']['RT_MAP_DOCUMENT'];
        RT_MAP_LAYER = window.hWin.HAPI4.sysinfo['dbconst']['RT_MAP_LAYER'];
        DT_DATA_SOURCE = window.hWin.HAPI4.sysinfo['dbconst']['DT_DATA_SOURCE'];
        DT_QUERY_STRING = window.hWin.HAPI4.sysinfo['dbconst']['DT_QUERY_STRING'];
        RT_QUERY_SOURCE = window.hWin.HAPI4.sysinfo['dbconst']['RT_QUERY_SOURCE'];
        DT_SYMBOLOGY = window.hWin.HAPI4.sysinfo['dbconst']['DT_SYMBOLOGY'];
        
        //_loadMapDocuments();
    }
    
    //
    // loads all map documents from server, init treeview and stores recordset in map_documents 
    //
    function _loadMapDocuments( onRefreshList ){
        
            if(!(RT_MAP_DOCUMENT>0)) return;
            
            var that = this;
        
            var request = {
                        q: 't:'+RT_MAP_DOCUMENT,w: 'a',
                        detail: 'header',
                        source: 'map_document'};
            //perform search        
            window.hWin.HAPI4.RecordMgr.search(request,
                function(response){
                    
                    if(response.status == window.hWin.ResponseStatus.OK){
                        var resdata = new hRecordSet(response.data);
                        map_documents = resdata;
                        
                        if($.isFunction(onRefreshList)) onRefreshList.call(that, resdata);
                    }else {
                        window.hWin.HEURIST4.msg.showMsgErr(response);
                    }

                }
            );           
        
    }
    
    //
    // returns content of mapdocument in fancytree data format
    //
    function _getTreeData( mapdoc_id ){
        
        var treedata = [];
        
        var resdata = map_documents_content[mapdoc_id];
        if(resdata){
            var idx, records = resdata.getRecords();
            for(idx in records){
                if(idx)
                {
                    var record = records[idx];
                    
                    if(resdata.fld(record, 'rec_RecTypeID')==RT_MAP_LAYER){
                        var recID  = resdata.fld(record, 'rec_ID'),
                        recName = resdata.fld(record, 'rec_Title');
                        
                        var $res = {};  
                        $res['key'] = recID;
                        $res['title'] = recName;
                        $res['type'] = 'layer';
                        $res['mapdoc_id'] = mapdoc_id; //reference to parent mapdoc
                        $res['selected'] = true;

                        treedata.push($res);
                    }
                }
            }//for
        }
        return treedata;
    }
    

    //
    // load all linked layers and dataset records for given map document
    // invoked from _openMapDocument and call the same method when data are recieved from server side
    // deferred object is required for treeview, it returns treeview data
    //    
    function _loadMapDocumentContent(mapdoc_id, deferred){

//{"any":[{"ids":11},{"all":{"t":"25","linkedfrom":11}}]}        
        
            var request = {
                        q: {"t":RT_MAP_LAYER,"linkedfrom":mapdoc_id},  //layers linked to given mapdoc
                        rules:[{"query":"linkedfrom:"+RT_MAP_LAYER+"-"+DT_DATA_SOURCE}], //data sources linked to layers
                        w: 'a',
                        detail: 'detail',
                        source: 'map_document'};
            //perform search        
            window.hWin.HAPI4.RecordMgr.search(request,
                function(response){
                    
                    if(response.status == window.hWin.ResponseStatus.OK){
                        var resdata = new hRecordSet(response.data);
                        
                        map_documents_content[mapdoc_id] = resdata;
                        
                        if(deferred){
                            var treedata = _getTreeData(mapdoc_id);
                            deferred.resolve( treedata ); //returns data t fancytree to render child layers for given mapdocument
                        }
                        
                        _openMapDocument( mapdoc_id );
                        
                    }else {
                        map_documents_content[mapdoc_id] = 'error';
                        window.hWin.HEURIST4.msg.showMsgErr(response);
                        if(deferred) deferred.reject( ); //deferred.resolve( [] );
                    }

                }
            );           
        
    }

    //
    // opens map document - loads content (resolve deferred - to updated treeview) and add layers on map
    //
    function _openMapDocument(mapdoc_id, deferred){
        
        //get list of layers and datasets
        if(!map_documents_content[mapdoc_id]){
            //map doc is bot loaded yet
            _loadMapDocumentContent(mapdoc_id, deferred);
            return;
        }else if(map_documents_content[mapdoc_id]=='error'){
            //prevent loop
            return;
        }
        
        var resdata = map_documents_content[mapdoc_id];
        
        var idx, records = resdata.getRecords();
        for(idx in records){
            if(idx)
            {
                var record = records[idx];
                
                if(resdata.fld(record, 'rec_RecTypeID')==RT_MAP_LAYER){
                    var recID  = resdata.fld(record, 'rec_ID'),
                        datasource_recID = resdata.fld(record, DT_DATA_SOURCE);    

                    var datasource_record = resdata.getById( datasource_recID );
                    
                    //creates and add layer to nativemap
                    //returns mapLayer object
                    record['layer'] = new hMapLayer2({rec_layer: record, 
                                                      rec_datasource: datasource_record, 
                                                      mapdoc_recordset: resdata, //need to get fields
                                                      mapwidget: options.mapwidget});
                }
            }
        }//for
    }



    // get layer record, take symbology field and title 
    // open symbology editor
    // on exit 1) call mapLayer.applyStyles
    //         2) change title in tree and timeline
    function _editSymbology( mapdoc_id, rec_id, callback ){


        var _recset = map_documents_content[mapdoc_id];
        var _record = _recset.getById( rec_id );
        
        var layer_title = _recset.fld(_record, 'rec_Title');
        var layer_style = _recset.fld(_record, DT_SYMBOLOGY);
        if(!layer_style) layer_style = {};

        var current_value = layer_style;//affected_layer.options.default_style;
        ///console.log(affected_layer);                   
        current_value.sym_Name = layer_title; //affected_layer.options.layer_name;
        //open edit dialog to specify symbology
        window.hWin.HEURIST4.ui.showEditSymbologyDialog(current_value, true, function(new_value){

            var new_title = null, new_style = null;
            
            //rename in list
            if(!window.hWin.HEURIST4.util.isempty(new_value.sym_Name)
                && current_value.sym_Name!=new_value.sym_Name)
            {
                new_title = new_value.sym_Name;
                _recset.setFld(_record, 'rec_Title', new_value.sym_Name);
                delete new_value.sym_Name;
            }
            //update style
            _recset.setFld(_record, DT_SYMBOLOGY, new_value);
            
            
            (_record['layer']).applyStyle(new_value);
            
           //callback to update ui in mapManager
            if($.isFunction(callback)){
                callback( new_title, new_style );
            }
        });        
    }

    
    
    //public members
    var that = {
        getClass: function () {return _className;},
        isA: function (strClass) {return (strClass === _className);},
        getVersion: function () {return _version;},

        loadMapDocuments: function( onRefreshList ){
            _loadMapDocuments( onRefreshList );    
        },
        
        openMapDocument: function(mapdoc_id, deferred){
            _openMapDocument(mapdoc_id, deferred);
        },
        
        isLoaded: function(mapdoc_id){
           return !window.hWin.HEURIST4.util.isnull( map_documents_content[mapdoc_id] );
        },
        
        //
        //returns layer record or mapdocument record
        //
        getLayer: function(mapdoc_id, rec_id){
            
            if(map_documents_content[mapdoc_id]){
                var _record = null;
                if(rec_id>0){
                    _record = (map_documents_content[mapdoc_id]).getById( rec_id );
                }else{
                    _record = map_documents.getById( mapdoc_id );
                }
                if(_record) return _record; 
            }
            return null;
        },
        
        
        //
        // adds new layer to mapdoc
        // data - recordset, heurist query or json
        //
        addLayer: function(mapdoc_id, data, dataset_name){

            var curr_request;
            
            if( (typeof data.isA == "function") && data.isA("hRecordSet") ){
                    
                    var recset = data;
                    
                    if(recset.length()<2001){ //limit query by id otherwise use current query
                        curr_request = { w:'all', q:'ids:'+recset.getIds().join(',') };
                    }else{
                        curr_request = recset.getRequest();
                    }            
                
            }else if( window.hWin.HEURIST4.util.isObject(data)&& data['q']) {
                
                 curr_request = data;
            }
                
            if(!map_documents_content[mapdoc_id]){
                map_documents_content[mapdoc_id] = new hRecordSet(); //create new recordset
            }
            
            var recset = map_documents_content[mapdoc_id];
            
            //dataset_name is unique within mapdoc
            var search_res = recset.getSubSetByRequest({'rec_Title':('='+dataset_name)}); 
            
            //var _record = recset.getById(dataset_name);
            var _record;
            if(search_res && search_res.length()>0){
                
                var recID = search_res.getOrder();
                recID = recID[0];
                _record = recset.getById(recID);
                recset.setFld(_record, DT_QUERY_STRING, curr_request);
                //remove previous result set from map
                if(_record['layer']) _record['layer'].removeLayer();    
            }else{
                _record = {rec_ID:_uniqueid,  rec_Title:dataset_name, rec_RecTypeID:RT_MAP_LAYER,  d:{}};
                recset.setFld(_record, DT_QUERY_STRING, curr_request);
                _record = recset.addRecord(_uniqueid, _record);
                _uniqueid++;
            }
            
            recset.setFld(_record, 'layer',
                        new hMapLayer2({rec_datasource: _record, 
                                              mapdoc_recordset: recset, //need to get fields
                                              mapwidget: options.mapwidget}));
            
        },
         
        getTreeData: function( mapdoc_id )
        {
            return _getTreeData( mapdoc_id );
        },
        
        //@todo
        zoomToMapDocument: function(mapdoc_id){
           console.log('todo zoom to maodoc '+mapdoc_id); 
           //options.mapwidget.mapping('zoomToExtent', map_document_extent);  
        },

        
        //
        // show/hide entire map document
        //
        setMapDocumentVisibulity: function( mapdoc_id, is_visibile ){
            //loop trough all 
            var resdata = map_documents_content[mapdoc_id];
            var idx, records = resdata.getRecords();
            for(idx in records){
                if(idx)
                {
                    var record = records[idx];
                    if(resdata.fld(record, 'rec_RecTypeID')==RT_MAP_LAYER && record['layer']){
                        (record['layer']).setVisibility( is_visibile );
                    }
                }
            }
        },
        
        //
        // remove map document data and remove it from map
        //
        closeMapDocument: function( mapdoc_id ){
            //loop trough all 
            var resdata = map_documents_content[mapdoc_id];
            if(resdata){
                var idx, records = resdata.getRecords();
                for(idx in records){
                    if(idx)
                    {
                        var record = records[idx];
                        if(resdata.fld(record, 'rec_RecTypeID')==RT_MAP_LAYER && record['layer']){
                            (record['layer']).removeLayer();
                        }
                    }
                }
                map_documents_content[mapdoc_id] = null;
            }
        },

        //
        //
        //
        removeLayer: function(mapdoc_id, rec_id){
            
            if(rec_id>0){
                var layer_rec = that.getLayer(mapdoc_id, rec_id);
                if(layer_rec){
                    (layer_rec['layer']).removeLayer();
                    
                    (map_documents_content[mapdoc_id]).removeRecord( rec_id );
                } 
            }
        },
        
        
        // get layer record, take symbology field and title 
        // open symbology editor
        // on exit 1) call mapLayer.applyStyles
        //         2) change title in tree and timeline
        editSymbology: function( mapdoc_id, rec_id, callback ){
            _editSymbology( mapdoc_id, rec_id, callback );    
        }

    }//end public methods

    _init( _options );
    return that;  //returns object
};

        
        