/**
* Filter by enity (record type)
* It takes entity id either from "by usage" list or from pre-selected list of record types
*
* @package     Heurist academic knowledge management system
* @link        http://HeuristNetwork.org
* @copyright   (C) 2005-2020 University of Sydney
* @author      Artem Osmakov   <artem.osmakov@sydney.edu.au>
* @note        Completely revised for Heurist version 4
* @license     http://www.gnu.org/licenses/gpl-3.0.txt GNU License 3.0
* @version     4.0
*/

/*
* Licensed under the GNU License, Version 3.0 (the "License"); you may not use this file except in compliance
* with the License. You may obtain a copy of the License at http://www.gnu.org/licenses/gpl-3.0.txt
* Unless required by applicable law or agreed to in writing, software distributed under the License is
* distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied
* See the License for the specific language governing permissions and limitations under the License.
*/


$.widget( "heurist.search_entity", {

    // default options
    options: {
        is_publication: false,
        use_combined_select: false,  // component is combination of 3 selectors (otherwise favorires are buttons)
        
        by_favorites: true,  // show buttons: filter by entity (show selected (favorires) entities)
        by_usage: true, // show dropdown entity filter (by usage)
        
        mouseover: null, //callback to prevent close h6 menu NOT USED
        search_realm: null
    },

    selected_rty_ids:[], //

    combined_select: null, // if use_combined_select  usage>,config>,list of favorites
    
    config_btn: null, // button to open config selector
    config_select: null, //configuration selector
    config_select_options: null,
    
    usage_btn: null, //by usage selector
    usage_select: null, 
    usage_select_options: null,

    // the constructor
    _create: function() {
        
        var that = this;
        
        if(this.options.is_publication){
            
            this.options.button_class = '';
            //this is CMS publication - take bg from parent
            this.element.addClass('ui-widget-content').css({'background':'none','border':'none'});
        }else{
            this.element.addClass('ui-widget-content');
        }
        
        //configuration - select favorites
        if(this.options.use_combined_select){
            
            this.combined_select = $('<div class="ui-heurist-header" style="top:0px;">Filter by entity</div>'
                +'<div style="top:37px;position:absolute;">'  //width:100%;
                    +'<div class="ui-heurist-title" style="padding:12px 0px 0px 6px;">By Usage</div>'
                    +'<ul class="by-usage" style="list-style-type:none;margin:0;padding:6px"/>'
                    +'<div class="ui-heurist-title favorites" style="border-top:1px gray solid; padding:12px 0px 0px 6px;">Favorites</div>'
                    +'<ul class="by-selected" style="list-style-type:none;margin:0;padding:6px"/>')
                .appendTo(this.element);

            this.config_btn = $('<span>').addClass('ui-icon ui-icon-gear')
                .css({float:'right','margin-right':'18px'})   //'font-size':'0.8em',
                .appendTo(this.combined_select.find('div.favorites'));        
                
        }else{
        
            this.element.css({height:'100%',height:'100%','font-size':'0.8em'});

            //------------------------------------------- filter by entities
            this.options.by_favorites = this.options.by_favorites && (window.hWin.HAPI4.get_prefs_def('entity_btn_on','1')=='1');
            
            var sz_search_padding = '0px';
            
            //container for buttons
            this.div_entity_btns   = $('<div>').addClass('heurist-entity-filter-buttons') //to show on/off in preferences
                                    .css({ 'display':(this.options.is_publication?'none':'block'),
                                        'padding':'10px 20px', //this.options.is_publication?0:('20px 5 20px '+sz_search_padding),
                                        'visibility':this.options.by_favorites?'visible':'hidden',
                                        'height':this.options.by_favorites?'auto':'10px'})
                                    .appendTo( this.element );
            //Main label
            var $d2 = $('<div>').css('float','left');
            $('<label>').text(window.hWin.HR('Entities')).appendTo($d2);
            
            //quick filter by entity  "by usage" 
            if(this.options.by_usage)
            {
                //Label for search by usage
                this.usage_btn = $('<span title="Show list of entities to filter">'
                +'by usage <span class="ui-icon ui-icon-triangle-1-s"></span></span>')  
                .addClass('graytext')
                .css({'text-decoration':'none','padding':'0 10px','outline':0,'font-weight':'bold','font-size':'1.1em', cursor:'pointer'})
                .appendTo( $d2 ); //was div_search_help_links
        
                //click on label "by usage" - opens selector
                this._on( this.usage_btn, {  click: function(){
                        this._openSelectRectypeFilter( this.usage_select_options );
                        return false;
                } });
            }
        
            $d2.appendTo(this.div_entity_btns);
            
            this.config_btn = $('<button>').button({label: window.hWin.HR("Show list of entities to filter"), 
                      showLabel:false, icon:'ui-icon-gear'})
            .css({'font-size':'0.915em'})
            .appendTo($d2);        
        }        
        //click on button - opens rectype selector with checkboxes
        this._on( this.config_btn, {  click: function(){
                this._openSelectRectypeFilter( this.config_select_options );
                return false;
        } });
            
        
        
        if(this.options.use_combined_select || this.options.by_usage){
            
                this.usage_select_options = {select_name:'usage_select', 
                        useIcons: true, useCounts:true, useGroups:false, 
                        ancor:this.usage_btn, 
                        onselect: function __onSelectRectypeFilter(event, data){
                                       var selval = data.item.value;
                                       if(selval>0){
                                           that._doSearch(selval);
                                       }
                                       return false;
                                   }};            
        }                
        
        //selector with checkboxes to select filter by entity buttons
        this.config_select_options = {select_name:'config_select', 
                useIcons: true, useCounts:true, useGroups:true, useCheckboxes:true, 
                ancor: this.config_btn, 
                marked: this.selected_rty_ids,
                showAllRectypes: true, 
                onmarker: function (ele){
                    var is_checked = !ele.hasClass('ui-icon-check-on');
                    var rty_ID = ele.attr('data-id');
                    
                    ele.removeClass('ui-icon-check-'+(is_checked?'off':'on'))
                        .addClass('ui-icon-check-'+(is_checked?'on':'off'));                    
                    
                    var idx = window.hWin.HEURIST4.util.findArrayIndex(rty_ID, this.selected_rty_ids);
                    if(is_checked){
                        if(idx<0) this.selected_rty_ids.push(rty_ID);    
                    }else{
                        if(idx>=0) this.selected_rty_ids.splice(idx, 1);    
                    }
                    this._redraw_buttons_by_entity();
                },
                onselect: function __onSelectRectypeFilter(event, data){
                               var selval = data.item.value;
                               if(selval>0){
                                   that._doSearch(selval);
                               }
                               return false;
                           }};            
        
         
         
        //-----------------------

        //global listeners
        /*
        $(window.hWin.document).on(
            window.hWin.HAPI4.Event.ON_CREDENTIALS+' '
                +window.hWin.HAPI4.Event.ON_PREFERENCES_CHANGE, function(e, data) {
                    
            if(e.type == window.hWin.HAPI4.Event.ON_PREFERENCES_CHANGE){
                //@todo update btn_select_owner label
            }
            if(!data || data.origin!='search'){
                that._refresh();
            }
        });*/
        $(window.hWin.document).on(
            window.hWin.HAPI4.Event.ON_REC_UPDATE
            + ' ' + window.hWin.HAPI4.Event.ON_STRUCTURE_CHANGE, 
            function(e, data) { 
                that._recreateRectypeSelectors();
            });
            
            
        //this.div_search.find('.div-table-cell').css('vertical-align','top');

        this._recreateRectypeSelectors();
        
        this._refresh();

    }, //end _create
             
    //
    // recreate list of buttons or recreate combined_select
    //
    _redraw_buttons_by_entity: function(is_init){
        
        if(is_init===true){
            //get selected from preferences
            this.selected_rty_ids = window.hWin.HAPI4.get_prefs_def('entity_filter_btns','');
            
            if(window.hWin.HEURIST4.util.isempty(this.selected_rty_ids)){
                this.selected_rty_ids = [];
                
                if(true){
                    //get 5 from first group
                    var rectypes = window.hWin.HEURIST4.rectypes.groups[0].allTypes;
                    for(var m=0; m<rectypes.length && m<5; m++){
                        this.selected_rty_ids.push(rectypes[m]);
                    }
                }else{
                    //get 5 top most used rectypes
                    var sorted = [];
                    for(var rty_ID in window.hWin.HEURIST4.rectypes.counts)
                    if(rty_ID>0){
                        sorted.push({'id':rty_ID, 'cnt':window.hWin.HEURIST4.rectypes.counts[rty_ID]});
                    }
                    sorted.sort(function(a,b){
                         return Number(a['cnt'])<Number(b['cnt'])?1:-1;
                    });
                    for(var idx=0; idx<sorted.length && idx<5; idx++){
                        this.selected_rty_ids.push(sorted[idx]['id']);    
                    }
                }
            }else{
                this.selected_rty_ids = this.selected_rty_ids.split(',');    
            }
            
        }
        

        var cont;
        if(this.options.use_combined_select){
            if(true || !this.combined_select){

                this._off(this.combined_select.find('li[data-id]'), 'click');
                var cont = this.combined_select.find('.by-usage');
                cont.empty();
                
                $.each(this.usage_select.find('option'),function(i, item){
                    item = $(item);
                    $('<li data-id="'+item.attr('entity-id')+'" style="font-size:smaller;padding:4px 0px 2px 0px">'
                        +'<img src="'+window.hWin.HAPI4.baseURL+'hclient/assets/16x16.gif'
                            + '" class="rt-icon" style="vertical-align:bottom;background-image: url(&quot;'+item.attr('icon-url')+ '&quot;);"/>'
                        //+'<img src="'+item.attr('icon-url')+'"/>'
                        +'<div class="menu-text truncate" style="max-width:147px;display:inline-block;">'
                        +item.text()+'</div>'
                        +'<span style="float:right;">'+item.attr('rt-count')+'</span>'
                       +'</li>').appendTo(cont);    
                });
            }
            
            cont = this.combined_select.find('.by-selected');
            cont.empty();
        }else{ 
            this._off( this.div_entity_btns.find('.entity-filter-button'), 'click');
            this.div_entity_btns.find('.entity-filter-button').remove();
        }
        
        
        
        var idx=this.selected_rty_ids.length-1;
        while(idx>=0){
            
            var rty_ID = this.selected_rty_ids[idx];
            
            if(rty_ID>0 && window.hWin.HEURIST4.rectypes.names[rty_ID]) {           
                
                if(this.options.use_combined_select){
                    
                    $('<li data-id="'+rty_ID+'" style="font-size:smaller;padding:4px 6px 2px 4px">'
                        +'<img src="'+window.hWin.HAPI4.baseURL+'hclient/assets/16x16.gif'
                            + '" class="rt-icon" style="vertical-align:bottom;background-image: url(&quot;'
                            + window.hWin.HAPI4.iconBaseURL + rty_ID+ '.png&quot;);"/>'
                        +'<div class="menu-text truncate" style="max-width:130px;display:inline-block;">'
                        +window.hWin.HEURIST4.rectypes.names[rty_ID]+'</div>'
                        //+'<span class="menu-text">'+window.hWin.HEURIST4.rectypes.names[rty_ID]+'</span>'
                        +'<span style="float:right;">'
                        +((window.hWin.HEURIST4.rectypes.counts[rty_ID]>0)?window.hWin.HEURIST4.rectypes.counts[rty_ID]:0)+'</span>'
                       +'</li>').appendTo(cont);
                    
                }else{
            
                    var btn = $('<div>').button({label:
                    '<img src="'+window.hWin.HAPI4.iconBaseURL + rty_ID + '.png" height="12">'
                    +'<span class="truncate" style="max-width:100px;display:inline-block;margin-left:8px">'
                            + window.hWin.HEURIST4.rectypes.names[rty_ID] + '</span>'
                            + '<span style="float:right;padding:2px;font-size:0.8em;">['   
                            +  ((window.hWin.HEURIST4.rectypes.counts[rty_ID]>0)?window.hWin.HEURIST4.rectypes.counts[rty_ID]:0)
                            +']</span>'}) 
                        .attr('data-id', rty_ID)
                        .css({'margin-left':'6px','font-size':'0.9em'})        
                        .addClass('entity-filter-button')  // ui-state-active
                        .insertAfter(this.config_btn.parent()); //appendTo(this.div_entity_btns);
                    
                }
            
            }else{
                //remove wrong(removed) rectypes
                is_init = false;
                this.selected_rty_ids.splice(idx,1);
            }
            idx--;
            
        }//for
        
                
        if(this.options.use_combined_select){
            
            this._on( this.combined_select.find('li[data-id]'), {click: function(e){
                   var selval = $(e.target).is('li')?$(e.target) :$(e.target).parent('li');
                   selval = selval.attr('data-id');
                   if(selval>0){
                       this._doSearch(selval);
                   }
            },
            mouseover: function(e){ 
                var li = $(e.target).is('li')?$(e.target) :$(e.target).parent('li');
                li.addClass('ui-state-active'); },
            mouseout: function(e){ 
                var li = $(e.target).is('li')?$(e.target) :$(e.target).parent('li');
                li.removeClass('ui-state-active'); }
            });
            
        }else{
         
            this._on( this.div_entity_btns.find('div.entity-filter-button'), {  click: function(e){
                   var selval = $(e.target).hasClass('entity-filter-button')
                            ?$(e.target):$(e.target).parent('.entity-filter-button');
                   selval = selval.attr('data-id');
                   if(selval>0){
                       this._doSearch(selval);
                   }
            } });
            
            var that = this;
            this.div_entity_btns.sortable({
                //containment: 'parent',
                items: '.entity-filter-button',
                cursor: 'move',
                handle:'img',
                delay: 250,
                axis: 'x',
                stop:function(){
                    that.selected_rty_ids = [];
                    $.each(that.div_entity_btns.find('.entity-filter-button'),function(idx, item){
                      that.selected_rty_ids.push( $(item).attr('data-id') );
                    })
                    window.hWin.HAPI4.save_pref('entity_filter_btns', that.selected_rty_ids.join(','));
                }}
            );
        }
        
        
        if(is_init!==true){
            //save in user preferences
            window.hWin.HAPI4.save_pref('entity_filter_btns', this.selected_rty_ids.join(','));
        }
            
    },

    
    /* private function */
    _refresh: function(){
    },

    //
    // creates selectors usage_select or config_select
    //
    _recreateSelectRectypeFilter: function(opts){
            var that = this;

            var exp_level = window.hWin.HAPI4.get_prefs_def('userCompetencyLevel', 2);
            
            var select_rectype = opts['select_name'];
            
            opts.useIds = (exp_level<2);
            
            opts.useHtmlSelect = (select_rectype=='usage_select' && that.options.use_combined_select);
            
            this[select_rectype] = window.hWin.HEURIST4.ui.createRectypeSelectNew(null, opts);
                        
            if(this[select_rectype].hSelect("instance")!=undefined){
                var menu = this[select_rectype].hSelect( "menuWidget" );
                menu.css({'max-height':'450px'});                        
                this[select_rectype].hSelect({change: opts.onselect});
                this[select_rectype].hSelect('hideOnMouseLeave', opts.ancor);
            }
            
    },
    

    //
    // recreate rectype selectors and filter button set
    // 1. searches counts by rectype
    // 2. redraw buttons by entiry
    // 3. recres selectors for config and "by usage"
    //
    _recreateRectypeSelectors: function(){

        var that = this;
        
        window.hWin.HEURIST4.rectypes.counts_update = (new Date()).getTime();
                    
        var request = {
                'a'       : 'counts',
                'entity'  : 'defRecTypes',
                'mode'    : 'record_count',
                'ugr_ID'  : window.hWin.HAPI4.user_id()
                };
                             
        window.hWin.HAPI4.EntityMgr.doRequest(request, 
            function(response){

                if(response.status == window.hWin.ResponseStatus.OK){
    
                    window.hWin.HEURIST4.rectypes.counts = response.data;
                    
                    //selector to filter by entity
                    if(that.options.use_combined_select || that.options.by_usage){
                            that._recreateSelectRectypeFilter(that.usage_select_options);
                    }
                        
                    //buttons - filter by entity
                    if(that.options.by_favorites){
                        that._redraw_buttons_by_entity(true);
                        that.config_select_options.marked = that.selected_rty_ids;
                        
                        that._recreateSelectRectypeFilter(that.config_select_options);
                        
                        /*
                        if(that.options.mouseover && that.config_select){
                            that._on( that.config_select.hSelect( "menuWidget" ), {mouseover: that.options.mouseover});    
                        }
                        */
            
                        
                    }
        
                }else{
                    window.hWin.HEURIST4.msg.showMsgErr(response);
                    window.hWin.HEURIST4.rectypes.counts_update = 0;
                }
        });
        
    },


    //
    // opens selector on correct position
    //
    _openSelectRectypeFilter: function( opts ){
        
                var select_rectype = opts['select_name'];
        
                var that = this;
                function __openSelect(){
                    
                    that[select_rectype].hSelect('open');
                    that[select_rectype].val(-1);
                    that[select_rectype].hSelect('menuWidget')
                        .position({my: "left top", at: "left+10 bottom-4", of: opts['ancor']});
            
                    var menu = $(that[select_rectype].hSelect('menuWidget'));
                    var ele = $(menu[0]);
                    ele.scrollTop(0);        
                   
                    if(opts.useCheckboxes && $.isFunction(opts.onmarker)){
                        var spans = menu.find('span.rt-checkbox');
                        that._off(spans,'click');
                        that._on(spans,{'click':function(e){
                            if($(event.target).is('span')){
                                opts.onmarker.call(that, $(event.target) );
                                window.hWin.HEURIST4.util.stopEvent(e);
                            }}});
                        /*
                        menu.find('span.rt-checkbox').click(function(e){
                            if($(event.target).is('span')){
                                opts.onmarker.call(that, $(event.target) );
                                window.hWin.HEURIST4.util.stopEvent(e);
                            }
                        });
                        */
                    }
                    
                }
                
                if(this[select_rectype]){
                    __openSelect();
                }
                    

                /*            
                if(!window.hWin.HEURIST4.rectypes.counts ||
                    (new Date()).getTime() - window.hWin.HEURIST4.rectypes.counts_update > 30000)  //30 seconds
                {

                }else{
                    if(!this[select_rectype]){
                        this._recreateSelectRectypeFilter();
                    }
                    
                    __openSelect();
                } 
                */   
    },
        
    //
    // search from input - query is defined manually
    //
    _doSearch: function(rty_ID){

            //window.hWin.HAPI4.SystemMgr.user_log('search_Record_direct');
            //var request = window.hWin.HEURIST4.util.parseHeuristQuery(qsearch);

            var request = {};
            request.q = '{"t":"'+rty_ID+'"}';
            request.w  = 'a';
            request.detail = 'ids';
            request.source = this.element.attr('id');
            request.search_realm = this.options.search_realm;
            
            window.hWin.HAPI4.SearchMgr.doSearch( this, request );
            
            if($.isFunction(this.options.onClose)){
                this.options.onClose();
            }
    }

    // events bound via _on are removed automatically
    // revert other modifications here
    ,_destroy: function() {

        $(window.hWin.document).off(window.hWin.HAPI4.Event.ON_REC_UPDATE
          + ' ' + window.hWin.HAPI4.Event.ON_STRUCTURE_CHANGE);
        
        this.div_entity_btns.find('.entity-filter-button').remove();

        if(this.usage_btn) this.usage_btn.remove();
        
        if(this.config_select) {
            if(this.config_select.hSelect("instance")!=undefined){
               this.config_select.hSelect("destroy"); 
            }
            this.config_select.remove();   
        }
        if(this.usage_select) {
            if(this.usage_select.hSelect("instance")!=undefined){
               this.usage_select.hSelect("destroy"); 
            }
            this.usage_select.remove();   
        }        
        
        this.div_entity_btns.remove();
        
        if(this.combined_select) this.combined_select.remove();
    }

});
