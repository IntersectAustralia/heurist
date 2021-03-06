/**
* Search header for manageDefRecTypes manager
*
* @package     Heurist academic knowledge management system
* @link        http://HeuristNetwork.org
* @copyright   (C) 2005-2020 University of Sydney
* @author      Artem Osmakov   <artem.osmakov@sydney.edu.au>
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

$.widget( "heurist.searchDefRecTypes", $.heurist.searchEntity, {

    //
    _initControls: function() {
        
        var that = this;
        
        //this.widgetEventPrefix = 'searchDefRecTypes';
        
        this._super();

        //hide all help divs except current mode
        var smode = this.options.select_mode; 
        this.element.find('.heurist-helper1').find('span').hide();
        this.element.find('.heurist-helper1').find('span.'+smode+',span.common_help').show();
        
        this.btn_add_record = this.element.find('#btn_add_record');
        this.btn_find_record = this.element.find('#btn_find_record');

        if(this.options.edit_mode=='none'){
            this.btn_add_record.hide();
            this.btn_find_record.hide();
        }else{
            /*
            this.btn_add_record.css({'min-width':'9m','z-index':2})
                    .button({label: window.hWin.HR("Add New Record Type"), icon: "ui-icon-plus"})
                .click(function(e) {
                    that._trigger( "onadd" );
                }); 

            this.btn_find_record.css({'min-width':'9m','z-index':2})
                    .button({label: window.hWin.HR("Find/Add Record Type"), icon: "ui-icon-search"})
                .click(function(e) {
                    that._trigger( "onfind" );
                }); 
                
            //@todo proper alignment
            if(this.options.edit_mode=='inline'){
                this.btn_add_record.css({'float':'left','border-bottom':'1px lightgray solid',
                'min-height': '2.4em', 'margin-bottom': '0.4em'});    
            }
            */                       
        }
        
        this._on(this.input_search_type,  { change:this.startSearch });
        
        //@todo - possible to remove
        if( this.options.rtg_ID>0 ){
            this.input_search_group.parent().hide();
            this.input_search_group.val(this.options.rtg_ID);
        }else if( this.options.rtg_ID<0 ){  //addition of recctype to group
            //find any rt not in given group
            //exclude this group from selector
            this.input_search_group.find('option[value="'+Math.abs(this.options.rtg_ID)+'"]').remove();
        }else{
            this.btn_find_record.hide();
        }
             
        this.input_sort_type = this.element.find('#input_sort_type');
        this._on(this.input_sort_type,  { change:this.startSearch });
           
                      
        if( this.options.import_structure ){
            //this.element.find('#div_show_already_in_db').css({'display':'inline-block'});    
            this.chb_show_already_in_db = this.element.find('#chb_show_already_in_db');
            this._on(this.chb_show_already_in_db,  { change:this.startSearch });
            
            this.options.simpleSearch = true;
        }
        if( this.options.simpleSearch){
            this.element.find('#div_search_group').hide();
            this.element.find('#input_sort_type_div').hide();
        }else{
            this.reloadGroupSelector();
        
        
            this.btn_ui_config = this.element.find('#btn_ui_config')
                    //.css({'width':'6em'})
                    .button({label: window.hWin.HR("Configure UI"), showLabel:false, 
                            icon:"ui-icon-gear", iconPosition:'end'});
            if(this.btn_ui_config){
                this._on( this.btn_ui_config, {
                        click: this.configureUI });
            }
        }
       
        if($.isFunction(this.options.onInitCompleted)){
            this.options.onInitCompleted.call();
        }
        
        //this.startSearch();            
    },  
    
    configureUI: function(){
        
        var that = this;

        var popele = that.element.find('#div_ui_config');
        
        popele.find('#input_ui_group').val(this.options.ui_params['groupsPresentation']);
        
        popele.find( ".toggles" ).controlgroup( {
            direction: "vertical"
        } ).sortable();       
        
        popele.find('.ui-checkboxradio-icon').css('color','black');

        popele.find('input[type="checkbox"]').prop('checked', '');
        $(this.options.ui_params['fields']).each(function(idx,val){
            popele.find('input[name="'+val+'"]').prop('checked', 'checked');    
        });
        popele.find( ".toggles" ).controlgroup('refresh');
        
        var $dlg_pce = null;

        var btns = [
            {text:window.hWin.HR('Apply'),
                click: function() { 
                    
                    var fields = [];
                    popele.find('input[type="checkbox"]:checked').each(function(idx,item){
                        fields.push($(item).attr('name'));
                    })
                    
                    //get new parameters
                    var params = { 
                        groupsPresentation: popele.find( '#input_ui_group' ).val(),
                        fields: fields
                    };
                    
                    that.options.ui_params = params;
                    //trigger event to redraw list
                    that._trigger( "onuichange", null, params );
                   
                    $dlg_pce.dialog('close'); 
            }},
            {text:window.hWin.HR('Cancel'),
                click: function() { $dlg_pce.dialog('close'); }}
        ];            

        $dlg_pce = window.hWin.HEURIST4.msg.showElementAsDialog({
            window:  window.hWin, //opener is top most heurist window
            title: window.hWin.HR('Configure User Interface'),
            width: 420,
            height: 550,
            element:  popele[0],
            //resizable: false,
            buttons: btns
        });



    },

    //
    //
    //
    changeUI: function(){
        
        if( this.options.simpleSearch) return;
        
        var params = this.options.ui_params;
        
        var sel_group = this.element.find('#sel_group');
        var tabheight = 0;
        
        if(params['groupsPresentation']=='tab'){
            sel_group.show();
            tabheight = sel_group.height();
        }else{
            sel_group.hide();
        }
        if(params['groupsPresentation']=='select'){
            this.element.find('#div_search_group').show();            
        }else{
            //that.element.find('#div_search_group').hide();
        
            //activate tab of list according to selected group
            var grpid =  this.input_search_group.val();
            
            if(grpid=='any'){
                //select first after "any groupd"
                //this.input_search_group.val(this.input_search_group.first('option').attr('value')).change();
                this.input_search_group[0].selectedIndex = 1;
                this.input_search_group.change();
                grpid =  this.input_search_group.val();
            }
            
            var tab = this.selectGroup.find('li[data-grp="'+grpid+'"]');
            var tabidx = this.selectGroup.find('ul').children().index(tab);
            this.selectGroup.tabs('option','active', tabidx);
            
            this.searchList.find('li').removeClass('ui-state-active');
            this.searchList.find('li[value="'+grpid+'"]').addClass('ui-state-active');
        }
        
        return tabheight;
    },
    
    //
    //  recreate groups listings - selector, tab and list
    //
    reloadGroupSelector: function (rectypes){
        
        this.input_search_group = this.element.find('#input_search_group');   //rectype group

        window.hWin.HEURIST4.ui.createRectypeGroupSelect(this.input_search_group[0],
                                            [{key:'any',title:'any group'}], rectypes);
        this._on(this.input_search_group,  { change:this.startSearch });
        

        this.searchList = null;
        if(this.options.searchFormList){
            this.options.searchFormList.empty();
            this.searchList = $('<ol>').css({'list-style-type': 'none','padding':'0px'}).appendTo(this.options.searchFormList)
        }
        
        this.selectGroup = this.element.find('#sel_group');
        
        this.selectGroup.empty();
        var ul = $('<ul>').appendTo(this.selectGroup);
        var that = this;

        
        this.input_search_group.find('option').each(function(idx,item){
            if(idx>0){
                var grpid = $(item).attr('value');
                $('<li data-grp="'+grpid+'"><a href="#grp'+grpid+'">'+$(item).text()
                            +'</a><span class="ui-icon ui-icon-pencil" title="Edit Group" '
                            +'style="vertical-align: -webkit-baseline-middle;visibility:hidden;font-size:0.8em"/></li>')
                            .appendTo(ul);
                $('<div id="grp'+grpid+'"/>').appendTo(that.selectGroup);
                
                if(that.searchList!=null){
                    $('<li class="ui-widget-content" value="'+grpid+'"><span style="width:133px;display:inline-block">'+$(item).text()
                            +'</span><span class="ui-icon ui-icon-pencil" '
                            +' title="Edit Group" style="display:none;float:right;font-size:0.8em;position:relative"/></li>')  
                        .css({margin: '2px', padding: '0.2em', cursor:'pointer'}) 
                        .appendTo(that.searchList);    
                }
            }
        });//end each
        
        this.selectGroup.tabs();
        this.selectGroup.find('ul').css({'background':'none','border':'none'});
        this.selectGroup.css({'background':'none','border':'none',bottom:'20px'});
        this.selectGroup.find('li').hover(function(event){
                var ele = $(event.target);
                if(!ele.is('li')) ele = ele.parent();
                ele.find('.ui-icon-pencil').css('visibility','visible');
            }, function(event){
                var ele = $(event.target);
                if(!ele.is('li')) ele = ele.parent();
                ele.find('.ui-icon-pencil').css('visibility','hidden'); //parent().
            });

        
        this._on( this.selectGroup, { tabsactivate: function(event, ui){
            //var active = this.selectGroup.tabs('option','active');
            //console.log(ui.newTab.attr('data-grp'));
            this.input_search_group.val( ui.newTab.attr('data-grp') ).change();
        }  });

        
        this._on( this.selectGroup.find('.ui-icon-pencil'), {
            click: function(event){
                window.hWin.HEURIST4.ui.showEntityDialog('defRecTypeGroups', 
                    {edit_mode:'editonly', rec_ID: $(event.target).parent().attr('data-grp'), //select_mode:'single', 
                    onselect:function(event, data){
                        /*
                        $('#selected_div').empty();
                        var s = 'Selected ';
                        if(data && data.selection)
                        for(i in data.selection){
                            if(i>=0)
                                s = s+data.selection[i]+'<br>';
                        }
                        $('#selected_div').html(s);
                        */
                    }                    
                    } );
            }
        });
        
        if(this.searchList!=null){
            
            this.searchList.find('li').hover(function(event){
                var ele = $(event.target);
                if(!ele.is('li')) ele = ele.parent();
                ele.addClass('ui-state-hover');
                ele.find('.ui-icon-pencil').show();
            }, function(event){
                var ele = $(event.target);
                if(!ele.is('li')) ele = ele.parent();
                ele.removeClass('ui-state-hover');
                ele.find('.ui-icon-pencil').hide();
            });
            
            //sortable().
            this.searchList.selectable( {selected: function( event, ui ) {
                    that.searchList.find('li').removeClass('ui-state-active');
                    $(ui.selected).addClass('ui-state-active');
                    that.input_search_group.val( $(ui.selected).attr('value') ).change();
                }}).css({width:'100%',height:'100%'});
            
            /*
            this._on( searchList, { change: function(event){
                this.input_search_group.val( $(event.target).val() ).change();
            }});
            */
        }
        
    },
    
    //
    // public methods
    //
    startSearch: function(){
        
            this._super();
            
            var request = {}
        
            if(this.input_search.val()!=''){
                request['rty_Name'] = this.input_search.val();
            }
            
            if( this.options.rtg_ID<0 ){
                //not in given group
                request['not:rty_RecTypeGroupID'] = Math.abs(this.options.rtg_ID);
            }
        
            if(this.input_search_group.val()>0){
                request['rty_RecTypeGroupID'] = this.input_search_group.val();
            }
            
            
            if(this.chb_show_already_in_db && !this.chb_show_already_in_db.is(':checked')){
                    request['rty_ID_local'] = '=0';
            }
            
            this.input_sort_type = this.element.find('#input_sort_type');
            if(this.input_sort_type.val()=='recent'){
                request['sort:rty_Modified'] = '-1' 
            }else if(this.input_sort_type.val()=='id'){
                request['sort:rty_ID'] = '1';   
            }else{
                request['sort:rty_Name'] = '1';   
            }
  
            if(this.options.use_cache){
            
                this._trigger( "onfilter", null, request);            
            }else
            if(false && $.isEmptyObject(request)){
                this._trigger( "onresult", null, {recordset:new hRecordSet()} );
            }else{
                this._trigger( "onstart" );
        
                request['a']          = 'search'; //action
                request['entity']     = this.options.entity.entityName;
                request['details']    = 'id'; //'id';
                request['request_id'] = window.hWin.HEURIST4.util.random();
                
                //we may search users in any database
                request['db']     = this.options.database;

                //request['DBGSESSID'] = '423997564615200001;d=1,p=0,c=0';

                var that = this;                                                
           
                window.hWin.HAPI4.EntityMgr.doRequest(request, 
                    function(response){
                        if(response.status == window.hWin.ResponseStatus.OK){
                            that._trigger( "onresult", null, 
                                {recordset:new hRecordSet(response.data), request:request} );
                        }else{
                            window.hWin.HEURIST4.msg.showMsgErr(response);
                        }
                    });
                    
            }            
    }
});
