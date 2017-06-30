/**
*
* boro_nav.js (Beyond1914)
* 1. Searches for Web Content (static records) records
* 2. Constructs navigation menu (container specified by)
* 3. Event handler for navigation menu 
*       a) loads web content
*       b) switch to search widgets
*
* @package     Heurist academic knowledge management system
* @link        http://HeuristNetwork.org
* @copyright   (C) 2005-2016 University of Sydney
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


$.widget( "heurist.boro_nav", {

    // default options
    options: {
       //WebContent:25, // rectype ID for information pages content
       menu_div:'',   // id of navigation menu div
       entityType:'',
       entityID:null
    },
    
    data_content:{},
    static_pages:{},
    currentChar:null, 
    
    recset: null, //current recordset
    
    isempty: window.hWin.HEURIST4.util.isempty, //alias

    DT_NAME: 1, //window.hWin.HAPI4.sysinfo['dbconst']['DT_NAME'],     //1
    DT_GIVEN_NAMES: 18, //window.hWin.HAPI4.sysinfo['dbconst']['DT_GIVEN_NAMES'],
    DT_INITIALS: 72,
    DT_HONOR: 19,
    DT_EXTENDED_DESCRIPTION: 4, //window.hWin.HAPI4.sysinfo['dbconst']['DT_EXTENDED_DESCRIPTION'],
    DT_DATE: 9, //window.hWin.HAPI4.sysinfo['dbconst']['DT_DATE'],     //9
    //DT_YEAR: window.hWin.HAPI4.sysinfo['dbconst']['DT_YEAR'],     //73
    DT_START_DATE: 10, //window.hWin.HAPI4.sysinfo['dbconst']['DT_START_DATE'], //10
    DT_END_DATE: 11, //window.hWin.HAPI4.sysinfo['dbconst']['DT_END_DATE'], //11
    DT_ORDER: 261, //window.hWin.HAPI4.sysinfo['dbconst']['DT_ORDER'],

    DT_PARENT_PERSON: 16,
    DT_EVENT_TYPE: 77,
    DT_PLACE: 78,
    DT_DEGREE: 80,
    DT_SCHOOLING: 83,
    DT_MILAWARD: 87,
    DT_MILSERVICE: 88,
    DT_INSTITUTION: 97,
    DT_TERTIARY: 102,
    DT_AWARD_TERM: 98,
    DT_RANK_TERM: 99,
    DT_UNIT_TERM: 138,
    DT_OCCUPATION: 151,
    DT_EVENT_DESC: 999999,  //special field
    
    RT_PERSON: 10,
    RT_EVENTLET: 24,
    RT_GEOPLACE: 25,
    RT_INSTITUTION: 26,
    RT_TERTIARY: 27, 
    RT_MILAWARD: 28, 
    RT_MILSERVICE: 29,
    RT_SCHOOLING: 31,
    RT_OCCUPATION: 37,
    
    // the widget's constructor
    _create: function() {

        var that = this;

        this.element
        // prevent double click to select text
        .disableSelection();
        
        // Sets up element to apply the ui-state-focus class on focus.
        //this._focusable($element);

        this._refresh();

    }, //end _create

    // Any time the widget is called with no arguments or with only an option hash,
    // the widget is initialized; this includes when the widget is created.
    _init: function() {
        
        
    },

    //Called whenever the option() method is called
    //Overriding this is useful if you can defer processor-intensive changes for multiple option change
    _setOptions: function( ) {

        if(arguments[0] && arguments[0]['page_name']){
            var page_name = arguments[0]['page_name'];
            var page_id = this._getStaticPageIdByName(page_name);
            if(page_id>0){
                $('#'+this.options.menu_div).find('a.nav-link[data-id='+page_id+']').click();
            }
        }else{
        
            var wasChanged = (arguments['entityType']!=this.options.entityType ||
                              arguments['entityID']!=this.options.entityID);
            this._superApply( arguments );
            
            if(wasChanged){
                this.resolveEntity();
            }
        
        }
    },

    /*
    * private function
    * show/hide buttons depends on current login status
    */
    _refresh: function(){

        if($('#'+this.options.menu_div).length==1){
            var that = this;
            //seach for web content records
            var details = [this.DT_NAME, this.DT_ORDER, this.DT_EXTENDED_DESCRIPTION];

            var request = request = {q: 't:'+window.hWin.HAPI4.sysinfo['dbconst']['RT_WEB_CONTENT']
                     +' sortby:f:'+this.DT_ORDER,
                     w: 'all', detail:details };

            window.hWin.HAPI4.SearchMgr.doSearchWithCallback( request, function( recordset )
                {
                    if(recordset!=null){
                        that._constructNavigationMenu( recordset );
                    }
            });

        }
        
    },
    //
    // custom, widget-specific, cleanup.
    _destroy: function() {
        // remove generated elements
        //this.select_rectype.remove();
    },
    
    _constructNavigationMenu: function( recordset ){
    
        var that = this;
        var menu_ele = $('#'+this.options.menu_div);
        
        menu_ele.empty();    

        var recs = recordset.getRecords();
        var rec_order = recordset.getOrder();
        var idx=0, recID;
        
        this.static_pages = {};
        
        var html = '<ul class="nav navbar-nav">';
        
        for(; idx<rec_order.length; idx++) {
            recID = rec_order[idx];
            if(recID && recs[recID]&& recordset.fld(recs[recID], this.DT_ORDER)>0){
                    //var recdiv = this._renderRecord(recs[recID]);
                    var name = recordset.fld(recs[recID], this.DT_NAME)
                    html  += 
                        ('<li><a href="#" class="nav-link" data-id="'+recID+'">'
                        +name
                        +'</a></li>');
                        
                    that.static_pages[recID] = name.toLowerCase();
                    
                    //that.data_content[recID]
                    var content = recordset.fld(recs[recID], this.DT_EXTENDED_DESCRIPTION);
                    
                    //add section on page for database content
                    var ele = that._addClearPageDiv(recID);                

                    //add page content from database  
                    ele.html( content );    
                    
                    if(name.toLowerCase()!=='contribute'){
                        //add registration form
                        ele = $('<div>').attr('data-recID', recID).appendTo(ele); 
                        ele.load(window.hWin.HAPI4.baseURL + 'hclient/widgets/boro/boro_subscribe.html',
                        function(){
                            var recID = $(this).attr('data-recID');
                            var edit_form = $('.bor-page-'+recID).find('.newsletter-form');

                            if(edit_form.length>0){
                                that._refreshCaptcha(edit_form);
                                edit_form.find('#newsletter_type_submit').click(function(event){
                                    that._doSubsribeNewsLetter(edit_form);
                                    return false;
                                })
                            }
                        }
                        );
                    }
                      
            }
        }//for
        //add two special items - People and Search
        html  = html 
            +'<li><a href="#" class="nav-link" data-id="people">People</a></li>'
            +'<li><a href="#" class="nav-link" data-id="search">Search</a></li></ul>';
        
        menu_ele.html(html);
        
        /*
        $('.bor-dismiss-veil').click(function(event){
            event.preventDefault(); 
            $('.bor-veil').toggle("slide",{direction:"right"});
        });
        */
        
        var homepage_id = this._getStaticPageIdByName('home');
         
        menu_ele.find('.nav-link').click(function(event){
            
            var recID = $(event.target).attr('data-id');
            window.hWin.HEURIST4.util.stopEvent(event);

            var hdoc = $(window.hWin.document);
            
            if(recID=='people'){ //people by first char
            
                that.fillPeopleByFirstChar();
                
            }else if(recID==homepage_id && hdoc.find('.bor-page-'+homepage_id).is(':visible')){ //home page
                location.reload();
            }else{
                //hide all 
                hdoc.find('#main_pane > .clearfix').hide(); //hide all
                //show selected 
                hdoc.find('.bor-page-'+recID).show();
                //scroll to top
                hdoc.scrollTop(0);
                
                if(recID>0){
                    var edit_form = hdoc.find('.bor-page-'+recID).find('.newsletter-form');
                    if(edit_form.length>0){
                        that._refreshCaptcha(edit_form);
                    }
                }
                
            }
        

        });

        //init links to search personby first char
        $('div.bor-pagination > ul.pagination > li > a').click(function(event){
         
            var firstChar = $(event.target).text();
            $('div.bor-pagination > ul.pagination > li').removeClass('active');
            $('div.bor-pagination > ul.pagination > li > a[href="/people/'+ firstChar.toLowerCase() +'"]').parent().addClass('active');
            window.hWin.HEURIST4.util.stopEvent(event);
            that.fillPeopleByFirstChar(firstChar);
            
        });
        
        
        //load initial page based on url parameters
        var placeID = window.hWin.HEURIST4.util.getUrlParameter('placeid');
        var profileID = window.hWin.HEURIST4.util.getUrlParameter('profileid');
        
        if(placeID>0){
            this._setOptions({entityType:'place', entityID:placeID});
        }else if(profileID>0){ 
            this._setOptions({entityType:'profile', entityID:profileID});
        }else{
            $('#main_pane > .clearfix').hide(); //hide all
            $(menu_ele.find('.nav-link')[0]).click();
        }
        
        
       $('.bor-tooltip').tooltip({
            position: { my: "center bottom", at: "center top-5" },
            /* does not work
            classes: {
                "ui-tooltip": "ui-corner-all tooltip-inner"
            },*/
            tooltipClass:"tooltip-inner",
            hide: { effect: "explode", duration: 500 }
        });
        
    },
    
    _getStaticPageIdByName: function(name){
        for(var id in this.static_pages){
            if(id>0 && this.static_pages[id]==name.toLowerCase()){
                return id;                
            }
        }
        return 0;
    },

    //
    // add/clear page div on main_pane
    // add section on page for database content
    //
    _addClearPageDiv: function( recID ){
            var ele = $('.bor-page-'+recID); 
            
            if(ele.length==1){ 
                
               ele.empty(); 
               return ele;
            }else{
               return $('<div>').addClass('clearfix bor-page-'+recID).appendTo($('#main_pane'));
            }                                    
    },
    
    // NOT USED
    // executes smarty template for record   - it works however it is slowly. Hence, it is not used
    //    
    recordResolver: function( sType, recID ){
    
            var ele = this._addClearPageDiv( sType );
        
            //hide all 
            $('#main_pane').find('.clearfix').hide();
            //show selected 
            ele.show();
            //load and execute smarty template for record
            
            var sURL = window.hWin.HAPI4.baseURL + 'viewers/smarty/showReps.php?h4=1&w=a&db='+window.hWin.HAPI4.database
                            +'&q=ids:'+recID+'&template=BoroProfileOrPlace.tpl';
            
            ele.load(sURL);
    },
     
    //
    //
    // 
    resolveEntity: function(){
        
        var entityType = this.options.entityType;
        var entityID = this.options.entityID;
        if(!this.isempty(entityType) && (entityID>0 || entityType=='military-service') ){
            //switch to page
            
            
            if(entityType=='gender'){
                //assign value to faceted search

                var app1 = window.hWin.HAPI4.LayoutMgr.appGetWidgetByName('dh_search');
                if(app1 && app1.widget){
                    $(app1.widget).dh_search('doSearch3', {"f:20":entityID});    
                }              
                
            }else{
            
                var hdoc = $(window.hWin.document);
                hdoc.find('#main_pane > .clearfix').hide(); //hide all
                
                var pagename = entityType;
                if(entityType!='profile'){
                    pagename = 'connected-people'
                }
                
                hdoc.scrollTop(0);
                if(entityType=='profile'){
                    hdoc.find('.bor-page-profile').show();
                    this.fillProfilePage();    
                }else{
                    this.fillConnectedPeople();    
                }
            
            }
        } 
    },
    
    //
    // searches for person connected to particular Place or attribute
    //
    fillConnectedPeople: function(){
        
        var recID = this.options.entityID; //recid or termid
        var entType = this.options.entityType;
        var mapids = []; //records ids to be mapped
        var rankID = 0, unitID = 0;

        var request = {
            w: 'a',
            detail: 'detail', 
            //id: random
            source:this.element.attr('id')};
        
        //search for all related person to given entity
        if(entType=='place'){
            
            request['q'] = 'ids:'+recID;
            request['rules'] = [{"query":"t:24,26,29,33,37 linked_to:25 ", //eventlet,edu inst,mil service,death,occupation
                        "levels":[{"query":"t:10 linkedfrom:24,29,33,37"}, //persons
                                    //persons vis tertiary and schooling
                                  {"query":"t:27,31 linked_to:26-97","levels":[{"query":"t:10 linked_to:27,31"}]} ] }];
                                                                            //or linkedfrom via field 16
            
        }else if(entType=='institution'){

            request['q'] = 'ids:'+recID;  //find institute
            request['rules'] = [{"query":"t:27,31 linked_to:26-97",   //find education records
                                            "levels":[{"query":"t:10 linked_to:27,31"}]},  //find linked persons
                                {"query":"t:25 linkedfrom:26-78"}]; //find place
            
        }else if(entType=='tertiary-study'){
            //by degree term id
            request['q'] = [{"t":27},{"f:80":recID}];  //tert study
            
            request['rules'] = [{"query":"t:26 linkedfrom:27-97","levels": [{"query":"t:25 linkedfrom:26-78"}]}, //edu inst
                                {"query":"t:10 linked_to:27-102"}];
                                
        }else if(entType=='military-award'){
            //by award term id
            request['q'] = [{"t":28},{"f:98":recID}];  //awards
            request['rules'] = [{"query":"t:10 linked_to:28-87"}];
            
        }else if(entType=='military-service'){
            //by rank and unit term id
            var mil_service = [{"t":29}];
            var ids = recID.split(',');
            if(ids.length>0 && !isNaN(Number(ids[0])) && ids[0]>0){
                rankID = ids[0];
                mil_service.push({"f:99":rankID }); 
            }
            if(ids.length>1 && !isNaN(Number(ids[1])) && ids[1]>0){
                unitID = ids[1];
                mil_service.push({"f:138":unitID }); 
            }

            request['q'] = mil_service;
            request['rules'] = [{"query":"t:10 linked_to:29-88"}];
            
            //request['q'] = [{"t":10},{"linked_to:88":mil_service}];
        }else{
            //@todo redirect to error page
            $('.bor-page-error').show();
            return;
        }

        $('.bor-page-loading').show();
        
        //perform search
        var that = this;
        window.hWin.HAPI4.RecordMgr.search(request, function(response){

            //that.loadanimation(false);

            if(response.status != window.hWin.HAPI4.ResponseStatus.OK){
                $('#main_pane').find('.clearfix').hide(); //hide all
                window.hWin.HEURIST4.msg.showMsgErr(response);
                return;
            }
            
            that.recset = new hRecordSet(response.data);
            //prepare result 
            var idx, records = that.recset.getRecords();
            
            var isTertiary = false;
            var title = '';
            
            //get title - this is name of instition, place name or term value
            if(entType=='place'){
                var place = that.recset.getById(recID);
                place = that.__getPlace(place, 0); 
                if(place.link){
                    title = place['names'][0]; //full place name  
                    mapids = place.ids;
                } 
                
            }else if (entType=='institution'){
                var edu_inst = that.recset.getById(recID);
                title = that.recset.fld(edu_inst, that.DT_NAME);
                
                var place = that.__getPlace(edu_inst, 0);
                if(place.link){
                    //@todo - check that place has geo field
                    mapids = place.ids;
                }
                
                //detect what type of institution we have- school or uni
                isTertiary = (that.recset.getRectypes().indexOf(that.RT_SCHOOLING)<0);
                    
            }else if (entType=='military-service'){
                title = [];
                if(rankID>0) title.push(that.__getTerm( rankID ));
                if(unitID>0) title.push(that.__getTerm( unitID ));
                title = title.join(', ');
            }else {
                //military award
                title = that.__getTerm( recID );
            }
            $('#cp_header').text(title);
            
            // loop for persons and create new recordset to be sent to boro_persons widget
            var res_records = {}, res_orders = [];
            
            for(idx in records){
            
                var person = records[idx];
                var personID = that.recset.fld(person, 'rec_ID');
                var recTypeID = Number(that.recset.fld(person, 'rec_RecTypeID'));
                
                if(recTypeID == that.RT_PERSON){
                    res_records[personID] = person;
                    res_orders.push(personID);
                    
                    var html = '<li class="bor-stop">'; 
                    
                    //IMAGE AND NAME
                    var fullName = that.__composePersonName(person);
                    var profileLink = window.hWin.HAPI4.baseURL+'profile/'+personID+'/'+that.__composePersonNameTag(person);
                    var thumb = that.recset.fld(person, 'rec_ThumbnailURL');
               
                    var html_thumb = '';
                    if(thumb){
                        html_thumb = 
                            '<a href="'+profileLink+'" class="bor-stop-image ab-light" data-ab-yaq="233" style="background-color: rgb(223, 223, 223);" onclick="{window.hWin.boroResolver(event);}">'
                            +'<img src="'+thumb+'" height="36" alt="Photograph of '+fullName
                            +'" data-adaptive-background="1" data-ab-color="rgb(19,19,19)"></a>';
                    }else{
                        html_thumb = '<a href="'+profileLink
                            +'" class="bor-stop-image bor-stop-image-placeholder" onclick="{window.hWin.boroResolver(event);}"></a>';
                    }
                    
                    html = html + html_thumb + '<div class="bor-stop-description">'
                                + '<a href="'+profileLink+'" onclick="{window.hWin.boroResolver(event);}">'+fullName+'</a>';
                        
                    //-----------------
                    var story = '';
                  
                    if(entType=='tertiary-study'){

                        //find education record institution
                        var educat = that.recset.values(person, that.DT_TERTIARY);
                        var ind = 0;
                        if($.isArray(educat)){
                            
                            var res = [];
                            for (ind in educat){
                                var rec_id = educat[ind];
                                var record = that.recset.getById(rec_id);
                                if(record){
                                    var sDate = that.__getDate(record, [260,9,205]);//year of study
                                    var sEduInst = that.__getEduInst( record );
                                    res.push(sEduInst+(sDate?' in '+sDate:''));
                                }
                            }
                            
                            story = ' studied this at '+that.__joinAnd(res);
                        }                        
                        
                    }else if(entType=='institution'){
                        
                        if(isTertiary){
                        
                            var educat = that.recset.values(person, that.DT_TERTIARY);
                            var ind = 0;
                            if($.isArray(educat)){
                                
                                var res = [];
                                for (ind in educat){
                                    var rec_id = educat[ind];
                                    var record = that.recset.getById(rec_id);
                                    if(record){ //it is in recordset - it means edu inst is correct
                                        //degree, qualification, courses
                                        var term_id = that.recset.fld(record, that.DT_DEGREE);
                                        if(term_id>0){
                                            res.push('<a href="'
                                                + window.hWin.HAPI4.baseURL+'tertiary-study/'
                                                + term_id +'/a" onclick="{window.hWin.boroResolver(event);}">'
                                                + window.hWin.HEURIST4.ui.getTermDesc( term_id )+'</a>');
                                        }
                                    }
                                }//for
                                
                                story = ' studied '+that.__joinAnd(res)+' here';
                            }                        
                        }else{
                            story = ' attended school here';
                            //var school_ids = that.recset.values(person, that.DT_SCHOOLING);
                        }
                        
                    }else if (entType=='military-service'){
                        
                        var service = that.recset.values(person, that.DT_MILSERVICE);
                        var idx = 0;
                        if($.isArray(service)){
                            for (idx in service){
                                var rec_id = service[idx];
                                var record = that.recset.getById(rec_id);
                                if(record){ //it is in recordset
                                
                                    var eventDate = that.__getEventDates(record);
                                    
                                    var sUnit = that.__getTerm(that.recset.fld(record, 138));
                                    
                                    //places of service
                                    //var place = that.__getPlace(record, 0);
                                                
                                    story = ' held this rank '
                                            + (sUnit?' with '+sUnit:'')
                                            //+ (place.link?', '+place.link:'')
                                            + eventDate.desc;
                                    break;
                                }
                            }
                        }
                        
                    }else if (entType=='military-award'){

                        var awards = that.recset.values(person, that.DT_MILAWARD);
                        var idx = 0;
                        if($.isArray(awards)){
                            for (idx in awards){
                                var rec_id = awards[idx];
                                var record = that.recset.getById(rec_id);
                                if(record){ //it is in recordset
                                    var sDate = that.__getDate(record);//date of service
                                    
                                    var countID = that.recset.fld(record, 142); //counts
                                    var sCounts = (countID==3763)?'':that.__getTerm(countID);

                                    story = ' received this award ' 
                                        +(sCounts?sCounts:(sDate?' on '+that.__formatDate(sDate):''));
                                    break;
                                }
                            }
                        }                        
                    }else if(entType=='place'){
                        
                        var res = that.getTimelineByPersonAndPlace(person, recID);
                        var timeline = res.timeline;
                        timeline.sort(function(a,b){return a.year<b.year?-1:1});
                        res = [];
                        for(var k=0; k<timeline.length; k++){
                            if(timeline[k].story) res.push(timeline[k].story);
                        }
                        story = ' '+that.__joinAnd(res) + ' here';
                    }

                    html = html + story + '</div></li>';
                    that.recset.setFld(person, that.DT_EVENT_DESC, html);
                    
                }//if person
            }//for recset
            
            
            var res_recordset = new hRecordSet({
                count: res_orders.length,
                offset:0,
                fields: that.recset.getFields(),
                rectypes: [that.RT_PERSON],
                records: res_records,
                order: res_orders,
                mapenabled: true //???
            });            
            //hat.updateResultSet(res_recordset);
            
            //persons list
            
            var app1 = window.hWin.HAPI4.LayoutMgr.appGetWidgetByName('boro_place'); //rename to boro_connected
            if(app1 && app1.widget){
                $('#main_pane').find('.clearfix').hide(); //hide all
                $('.bor-page-aggregate').show();
                $(app1.widget).boro_place('updateResultSet', res_recordset);
            }
            
            //mapping
            if(mapids.length>0){
                var map_recset = that.recset.getSubSetByIds(mapids);
                map_recset.setMapEnabled();
                
                var params = {id:'main',
                    title: 'Current query',
                    recordset: map_recset,
                    color: '#ff0000'
                };            
                $('#cp_mapframe_container').show()
                var mapping = $('#cp_mapframe')[0].contentWindow.mapping;
                if(mapping && mapping.map_control){
                    mapping.map_control.addRecordsetLayer(params);
                }
                
            }else{
                $('#cp_mapframe_container').hide()  
            }            
            /* 
            if(mapids.length==0){
                $('#cp_mapframe_container').hide();
            }else{
                $('#cp_mapframe_container').show();
                
                var params = {id:'main',
                    title: 'Current query',
                    query: 'ids:'+mapids.join(','),
                    color: '#ff0000'
                };            
                var mapping = $('#cp_mapframe')[0].contentWindow.mapping;
                if(mapping && mapping.map_control){
                    mapping.map_control.addQueryLayer(params);
                }
            }*/
            
            
            
        });//end search
                
    }, //fillConnectedPeople
    

    //
    // searches for person with Family name started with given character
    //
    fillPeopleByFirstChar: function(firstChar){
        
        var that = this;
        
        if(that.isempty(firstChar) && $('#cp_people_by_char').children().length==0){
            firstChar = 'A';
        }

        if(that.isempty(firstChar) || that.currentChar == firstChar){
            $('#main_pane').find('.clearfix').hide(); //hide all
            $('.bor-page-people').show();
            return;
        }
        
        
        var request = {
            w: 'a',
            detail: [that.DT_NAME, that.DT_GIVEN_NAMES, that.DT_INITIALS, that.DT_HONOR, 'rec_ThumbnailURL', 'rec_ThumbnailBg'], 
            q: [{"t":"10"},{"f:1":firstChar+'%'},{"sortby":"t"}],//,{"sortby":"t"}
            //sortby:'t',
            //id: random
            source:this.element.attr('id')};

        $('#main_pane').find('.clearfix').hide();     
        $('.bor-page-loading').show();
        
        //perform search
        window.hWin.HAPI4.RecordMgr.search(request, function(response){

            if(response.status != window.hWin.HAPI4.ResponseStatus.OK){
                $('#main_pane').find('.clearfix').hide(); //hide all
                window.hWin.HEURIST4.msg.showMsgErr(response);
                return;
            }
            
            that.recset = new hRecordSet(response.data);
            
            var idx, html = '';
            
            var records = that.recset.getRecords();
            var rec_order = that.recset.getOrder();
            var len = rec_order.length;

            for(idx=0; idx<len; idx++) {
                var recID = rec_order[idx];
                if(recID>0 && records[recID]){

                    var person = records[recID];
                    var personID = that.recset.fld(person, 'rec_ID');

                    //IMAGE AND NAME
                    var fullName = that.__composePersonName(person);
                    var profileLink = window.hWin.HAPI4.baseURL+'profile/'+personID+'/'+that.__composePersonNameTag(person);
                    var thumb = that.recset.fld(person, 'rec_ThumbnailURL');

                    html = html + 
                    '<a class="bor-emblem-portrait" href="'+profileLink+'" onclick="{window.hWin.boroResolver(event);}">';

                    if(thumb){
                        html = html 
                        +'<div class="img-circle" style="background-color: '
                        + that.recset.fld(person, 'rec_ThumbnailBg')+ ';">' 
                        +'<img class="bor-emblem-portrait-image" height="130" src="'+thumb+'" alt="Photograph of '+fullName
                        +'"></div>';
                    }else{
                        html = html + '<div class="bor-emblem-portrait-image placeholder"></div>';
                    }

                    html = html + '<div class="bor-emblem-portrait-name">'+fullName+'</div></a>';
                }
            }//for recset
  
            $('#main_pane').find('.clearfix').hide(); //hide all
            $('.bor-page-people').show();
            $('#cp_people_by_char').html(html);
            $(window.hWin.document).scrollTop(0);
            
            that.currentChar = firstChar;
            
        });//end search
                
    }, //fillPeopleByFirstChar
    
    //
    // uses this.recset
    //
    getTimelineByPersonAndPlace: function(person, placeID){
        
            var that = this;
            var timeline = []; //{year: , date: , story: , descrption:}
            var mapids = [];
            var leftside = {};
            //LEFT SIDE
            //Lifetime
            var idx, html = '', sDate='', place = {ids:[0], link:''};
            var birthID = that.recset.fld(person, 103);
            if(birthID>0){
                var birth_rec = that.recset.getById(birthID);
                if(birth_rec){
                    var sDate = that.__getDate(birth_rec);
                    
                    place = that.__getPlace(birth_rec, 0);
                    mapids = mapids.concat(place.ids); 
                    html = '<li>Born '+that.__formatDate(sDate)+(place.link?' in '+place.link:'')+'</li>';   
                    
                    if(placeID==0){
                        that.__setPlaceDesc(place, 'birth', 'Birth '+(sDate?(' on '+that.__formatDate(sDate)):''));                    
                    }
                }
            }
            var birthYear = that.__getYear(sDate,1);
            timeline.push({year:birthYear,            //for sort
                        date: that.__getYear(sDate),  //year to display
                        date2: sDate,
                        story: 'was born',
                        description: 'Birth'+(html
                                ?(', '+place.link+(sDate?(' on '+that.__formatDate(sDate)):'') )
                                :'') });
                                                        
            var deathID = that.recset.fld(person, 95);
            place = {ids:[0], link:''};
            sDate = '';
            var sDeathType = '';
            if(deathID>0){
                
                var death_rec = that.recset.getById(deathID);
                if(death_rec){
                    sDate = that.__getDate(death_rec);
                    place = that.__getPlace(death_rec, 0);
                    mapids = mapids.concat(place.ids); 
                
                    sDeathType = that.__getTerm(that.recset.fld(death_rec, 143) );
                    if(sDeathType!='Killed in action'){
                        sDeathType = 'Died';
                    }
                    html = html + '<li>'+sDeathType+' '+that.__formatDate(sDate)+ (place.link?' in '+place.link:'') + '</li>';
            
                    if(placeID==0){
                        that.__setPlaceDesc(place, 'death', sDeathType+(sDate?(' on '+that.__formatDate(sDate)):''));                        
                    }
                    
                }
            }
            timeline.push({year:that.__getYear(sDate,9999), 
                        date: that.__getYear(sDate), 
                        date2: sDate,
                        story: sDeathType.toLowerCase(),
                        description: (sDeathType?(sDeathType+', '+place.link+(sDate?(' on '+that.__formatDate(sDate)):''))
                                                :'Death' ) });
            
            leftside['p_lifetime'] = html;
            
            //Gender -------------------------------
            //@todo facet link
            termID = that.recset.fld(person, 20);
            leftside['p_gender'] = '<a href="gender/'+termID
                    +'/a" onclick="{window.hWin.boroResolver(event);}">'+that.__getTerm( termID )+'</a>';

            //Early education -------------------------------
            var early = that.recset.values(person, that.DT_SCHOOLING);
            idx = 0
            html = '';
            if($.isArray(early)){
                for (idx in early){
                    var rec_id = early[idx];
                    var record = that.recset.getById(rec_id);
                    
                    if(record){
                        var sDate = that.__getDate(record);
                        var sEduInst = that.__getEduInst( record ); //get institution from education record
                        
                        var edu_record = that.recset.getById( that.recset.fld(record, that.DT_INSTITUTION) ); 
                        
                        var place = that.__getPlace(edu_record, 1);
                        mapids = mapids.concat(place.ids); 
                        
                        html = html + '<li>'+sEduInst
                                    +'<span class="bor-group-date">&nbsp;'+that.__formatDate(sDate)+'</span></li>';
                             
                        if(placeID==0 || place.ids.indexOf(placeID)>=0){
                                    timeline.push({year:that.__getYear(sDate,birthYear+1), 
                                            date: that.__getYear(sDate), 
                                            date2: null,
                                            story: 'attended school at '+sEduInst,
                                            description: 'Early education  at '+sEduInst+', '+place.link});
                            
                        }
                        
                        if(placeID==0){
                            that.__setPlaceDesc(place, 'schooling', 'Early education  at '+sEduInst);                    
                        }
                        
                    }
                }
            }
            
            leftside['p_education'] = html;
            
            //Tertiary education -------------------------------
            var educat = that.recset.values(person, that.DT_TERTIARY);
            idx = 0;
            html = '';
            if($.isArray(educat)){
                for (idx in educat){
                    var rec_id = educat[idx];
                    var record = that.recset.getById(rec_id);
                    if(record){
                        var sDate = that.__getDate(record, [260,9,205]);//year of study
                        
                        //degree, qualification, courses
                        var term_id = that.recset.fld(record, that.DT_DEGREE);
                        var sDegree = '<a href="'
                            + window.hWin.HAPI4.baseURL+'tertiary-study/'
                            + term_id +'/a" onclick="{window.hWin.boroResolver(event);}">'
                            + window.hWin.HEURIST4.ui.getTermDesc( term_id )+'</a>';
                        
                        var sEduInst = that.__getEduInst( record );

                        var edu_record = that.recset.getById( that.recset.fld(record, that.DT_INSTITUTION) ); 

                        var place = that.__getPlace(edu_record, 1);
                        mapids = mapids.concat(place.ids); 

                        html = html + '<li>' 
                                    + sDegree
                                    +'<span class="bor-group-date">&nbsp;'+that.__formatDate(sDate)+'</span></li>';
                                    
                        if(placeID==0 || place.ids.indexOf(placeID)>=0){
                            timeline.push({year:that.__getYear(sDate,birthYear+2), 
                                    date: that.__getYear(sDate), 
                                    date2: null,
                                    story: 'studied '+sDegree+' at '+sEduInst,
                                    description: 'Studied '+sDegree+' at '+sEduInst+','+place.link});
                        } 
                        
                        if(placeID==0){
                            that.__setPlaceDesc(place, 'tertiary-study', 'Studied '+sDegree+' at '+sEduInst);                    
                        }

                    }
                }
            }
            leftside['p_tertiary'] = html;

            //Events (79->t:24) -------------------------------
            
            // 4 - before service, 10 after service
            //Enlisted, Embarked, Served, Wounded, Demobilized, Returned, Married, Lived
            var allowed = [3302,4578,3693,4355,3303,3304,4254,3694];
            var deforder = [1914,1914,1914,1918,1919,1919,1919,1920];
            var events = that.recset.values(person, 79);
            idx = 0;
            if($.isArray(events)){
                for (idx in events){
                    var rec_id = events[idx];
                    var record = that.recset.getById(rec_id);
                    if(record){
                        var termID = Number(that.recset.fld(record, 77));
                        
                        if(termID==3298) continue; //exclude Birth
                        
                        var k = allowed.indexOf(termID);
                        var ord = (k<0)?1920:deforder[k];
                        
                        var eventDate = that.__getEventDates(record);
                        var sEventType = that.__getTerm(termID);
                        
                        var place = that.__getPlace(record, 0);
                        if(termID==4254 || termID==3694){ //married, lived
                            mapids = mapids.concat(place.ids); 
                            
                            if(placeID==0){
                                that.__setPlaceDesc(place, (termID==4254)?'married':'lived',
                                                        sEventType+eventDate.desc);                    
                            }
                        }
                        
                        if(placeID==0 || place.ids.indexOf(placeID)>=0){

                            timeline.push({year:that.__getYear(eventDate.date, ord), 
                                date: that.__getYear(eventDate.date), 
                                date2: eventDate.date,
                                eventTypeID: termID,
                                story: sEventType.toLowerCase(),
                                description: sEventType+(place.link?', '+place.link:'')+eventDate.desc });
                        }
                    }
                }
            }
            
            //Occupation Event (151->t:37) -------------------------------
            events = that.recset.values(person, 151);
            idx = 0;
            if($.isArray(events)){
                for (idx in events){
                    var rec_id = events[idx];
                    var record = that.recset.getById(rec_id);
                    if(record){
                        var eventDate = that.__getEventDates(record);
                        
                        var place = that.__getPlace(record, 0);
                        
                        var termID = that.recset.fld(record, 150);
                        var sOccupationTitle = that.__getTerm(termID);
                        
                        if(placeID==0 || place.ids.indexOf(placeID)>=0){

                            timeline.push({year:that.__getYear(eventDate.date, 1920), 
                                    date: that.__getYear(eventDate.date),
                                    date2: eventDate.date, 
                                    story: 'was '+sOccupationTitle.toLowerCase(),
                                    description: sOccupationTitle
                                        +(place.link?', '+place.link:'')+eventDate.desc });
                        }
                    }
                }
            }
            
            //Military Awards -------------------------------
            var awards = that.recset.values(person, that.DT_MILAWARD);
            idx = 0;
            html = '';
            if($.isArray(awards)){
                for (idx in awards){
                    var rec_id = awards[idx];
                    var record = that.recset.getById(rec_id);
                    if(record){
                        var sDate = that.__getDate(record);//date of service
                        
                        var countID = that.recset.fld(record, 142); //counts
                        var sCounts = (countID==3763)?'':that.__getTerm(countID);
                        
                        //name of award
                        var awardID = that.recset.fld(record, 98);
                        var sAward = window.hWin.HEURIST4.ui.getTermDesc( awardID );
                        
                        sAward = '<a href="'
                                + window.hWin.HAPI4.baseURL+'military-award/'
                                + awardID + '/a" onclick="{window.hWin.boroResolver(event);}">'
                                + sAward+'</a>';
                        
                        html = html + '<li>'+sAward
                                    + '<span class="bor-group-date">&nbsp;'+that.__formatDate(sDate)+' '
                                    + (sCounts?sCounts:'') + '</span></li>';
                                   
                        if(placeID==0){ 
                            timeline.push({year:that.__getYear(sDate, 1917), 
                                date: that.__getYear(sDate), 
                                date2: sDate,
                                story:'',
                                description: 'Awarded '+sAward+ ' '
                                    +(sCounts?sCounts: (sDate?' on '+that.__formatDate(sDate):'')) });
                        }
                                   
                    } 
                }
            }
            leftside['p_awards'] = html;

            //Military Service -------------------------------
            var service = that.recset.values(person, that.DT_MILSERVICE);
            idx = 0;
            html = '';
            if($.isArray(service)){
                for (idx in service){
                    var rec_id = service[idx];
                    var record = that.recset.getById(rec_id);
                    var eventDate = that.__getEventDates(record);
                    
                    var termID = Number(that.recset.fld(record, 77));//type
                    var k = allowed.indexOf(termID);
                    var ord = (k<0)?1916:deforder[k];
                    
                    //event type
                    var sEventType = that.__getTerm(termID);
                    if(!sEventType) {
                        termID = 3693;
                        sEventType = 'Served';//default   
                    }
                    
                    //rank
                    var rankID = that.recset.fld(record, 99);
                    var sRank = that.__getTerm(rankID);
                    //
                    var unitID = that.recset.fld(record, 138);
                    var sUnit = that.__getTerm(unitID);
                    
                    if(sRank){
                        sRank = '<a href="'
                            + window.hWin.HAPI4.baseURL+'military-service/'
                            + rankID + ',' +  (sUnit?unitID:0) + '/a" onclick="{window.hWin.boroResolver(event);}">'
                            + sRank+'</a>';
                    }else if(sUnit){
                        sUnit = '<a href="'
                            + window.hWin.HAPI4.baseURL+'military-service/0,'
                            + unitID +'/a" onclick="{window.hWin.boroResolver(event);}">'
                            + sUnit+'</a>';
                    }

                    
                    if(sRank){
                        html = html + '<li>' + sRank
                                + '<span class="bor-group-date">&nbsp;'+ eventDate.desc + '</span></li>';
                    }
                    
                    //places of service
                    var place = that.__getPlace(record, 0);
                    mapids = mapids.concat(place.ids);
                    
                    var sRankAndUnit = (sRank && sEventType?'as ':'')
                                    + sRank
                                    + (sUnit?' with '+sUnit:'');
                    
                    if(placeID==0 || place.ids.indexOf(placeID)>=0){            
                        timeline.push({year:that.__getYear(eventDate.date, ord), 
                            date: that.__getYear(eventDate.date), 
                            date2: eventDate.date,
                            eventTypeID:termID,
                            story: sEventType.toLowerCase()+' '+sRankAndUnit,
                            description: sEventType+' '+sRankAndUnit
                            + (place.link?', '+place.link:'')+eventDate.desc });
                    }
                    
                    if(placeID==0){
                        that.__setPlaceDesc(place, 'military-service',  sEventType+' '+sRankAndUnit);                    
                    }
                    
                }
            }
            
            //sort timeline array by year
            timeline.sort(function(a,b){
                if(a.year==b.year){
                    if(a.date2 && b.date2){
                        return a.date2 < b.date2 ?-1:1;
                    }else if(a.eventTypeID && b.eventTypeID){
                        return allowed.indexOf(a.eventTypeID)<allowed.indexOf(b.eventTypeID)?-1:1;
                    }else{
                        return 0;
                    }
                }else{
                    return a.year<b.year?-1:1    
                }
            });
            
            
            leftside['p_service'] = html;
            
            return {leftside:leftside,mapids:mapids,timeline:timeline};
    },
    
    //
    // generates profile page by record ID
    //
    fillProfilePage: function(){
        
        var recID = this.options.entityID;

        //search for record and all related records
        //that.loadanimation(true);
        var request = {
            w: 'a',
            detail: 'detail', 
            thumb_bg: 1,  //return bg color for thumbnail
            //id: random
            source:this.element.attr('id'),
            q:'ids:'+recID,
            rules:[{"query":"t:31,27 linkedfrom:10",  // school, tertiary education
                    "levels":[{"query":"t:26 linkedfrom:31,27",   //edu institution
                        "levels":[{"query":"t:25 linkedfrom:26"}]}]},  //place (location of institution)
                    
                {"query":"t:24,28,29,33,37 linkedfrom:10",  //eventlet,mil award,mil service,death,occupation
                        "levels":[{"query":"t:25 linkedfrom:-78"}]},  //location of event
                {"query":"t:5 linkedfrom:10-61,135,144"}]  //documents pdf,additional photos,documents
        };
            
        //perform search
        var that = this;
        window.hWin.HAPI4.RecordMgr.search(request, function(response){

            //that.loadanimation(false);

            if(response.status != window.hWin.HAPI4.ResponseStatus.OK){
                window.hWin.HEURIST4.msg.showMsgErr(response);
                return;
            }
            
            
            that.recset = new hRecordSet(response.data);

            //-----------------            
            var person = that.recset.getById(recID);
            var fullName = that.__composePersonName(person);
   
            //IMAGE AND NAME
            var html_thumb = '<a class="bor-emblem-portrait" href="#">';
            if( that.recset.fld(person, 'rec_ThumbnailURL') ){
                html_thumb = html_thumb
                            +'<div class="img-circle" style="background:'+that.recset.fld(person, 'rec_ThumbnailBg')+';">'
                                +'<img height="130" class="bor-emblem-portrait-image" src="' + that.recset.fld(person, 'rec_ThumbnailURL')
                                    +'" alt="Photograph of '+fullName+'">'
                            +'</div>';
            }else{
                html_thumb = html_thumb 
                        +'<div class="bor-emblem-portrait-image placeholder"></div>';
            }
            html_thumb = html_thumb +'<div class="bor-emblem-portrait-name">'+fullName+'</div></a>';
            
            $('#p_image').empty().append($(html_thumb));
            
            var res = that.getTimelineByPersonAndPlace(person, 0);
            
            var timeline = res.timeline;
            var mapids = res.mapids; //records ids to be mapped

            for(var key in res.leftside){
                var ele = [];
                if(key){
                    ele = $('#'+key);
                }
                if(ele.length>0){
                    if(that.isempty(res.leftside[key])){
                        ele.parent().hide();
                    }else{
                        ele.parent().show();
                        ele.empty().append($(res.leftside[key]));           
                    }
                }
            }

            //Other resources -------------------------------
            html = '';
            var fval = that.recset.fld(person, 74); //ADB id  http://adb.anu.edu.au/biography/percy-phipps-abbott-4962
            //that.__composePersonNameTag(record)
            if(!that.isempty(fval)){
                html = html + '<li><a target="_blank" href="http://adb.anu.edu.au/biography/'
                            + that.__composePersonNameTag(person) 
                            + '-'+fval+'">Australian Dictionary of Biography</a></li>'
            }
            
            fval = that.recset.fld(person, 37); //National Library of Australia id
            if(!that.isempty(fval)){
                html = html + '<li><a target="_blank" href="http://trove.nla.gov.au/people/'
                            + fval+'">National Library of Australia</a></li>'
            }
            
            fval = that.recset.values(person, 104); //Discovering Anzacs  url
            if($.isArray(fval)){
                idx = 0;
                for (idx in fval)
                if(!that.isempty(fval)){
                    html = html + '<li><a target="_blank" href="' + fval[idx]+'">Discovering Anzacs</a></li>'
                }
            }
            
            fval = that.recset.fld(person, 109); //War Graves commission
            if(!that.isempty(fval)){
                html = html + '<li><a target="_blank" href="'
                            + fval+'">War Graves commission</a></li>'
            }
            
            fval = that.recset.fld(person, 116); //Australian War Memorial  url
            if(!that.isempty(fval)){
                html = html + '<li><a target="_blank" href="'
                            + fval+'">Australian War Memorial</a></li>'
            }
            
            that.recset.values(person, 108); //Additional resources
            if($.isArray(fval)){
                idx = 0;
                for (idx in fval)
                if(!that.isempty(fval)){
                    html = html + '<li><a target="_blank" href="' + fval[idx]+'">Additional resource</a></li>'
                }
            }
            
            if(that.isempty(html)){
                $('#p_resources').parent().hide();            
            }else{
                $('#p_resources').parent().show();            
                $('#p_resources').empty().append($(html));            
            }
            
            //OCR text -------------------------------
            var fval = that.recset.fld(person, 134); //OCRd book entry or other narrative
            if(!that.isempty(fval)){
                $('#p_narrative').parent().show();            
                $('#p_narrative').text(fval);            
            }else{
                $('#p_narrative').parent().hide();            
            }

            //PDF of book entry -------------------------------
            html = '';
            fval = that.recset.values(person, 61);
            if($.isArray(fval)){
                idx = 0;
                for (idx in fval)
                if(!that.isempty(fval)){
                    var record = that.recset.getById(fval[idx]);
                    
                    html = html + 
                    '<a class="bor-download" data-type="bor entry pdf" data-name="'
                    + fullName +'" href="'
                    + window.hWin.HAPI4.baseURL+'redirects/file_download.php?db=' + window.hWin.HAPI4.database 
                    + '&id=' + that.recset.fld(record, 38) + '"><span style="display:inline-block" class="ui-icon ui-icon-download"></span> Download entry ( PDF '
                    + Math.round(that.recset.fld(record, 67)/1024) +'KB )</a>'
                }
            }
            $('#p_pdf_entry').empty().append($(html));            
            
            
            //Last updated -------------------------------
            fval = that.__getDate(person, ['rec_Modified']); 
            if(!that.isempty(fval)){
                $('#p_lastupdated').parent().show();            
                $('#p_lastupdated').empty().append(that.__formatDate(fval));            
            }else{
                $('#p_lastupdated').parent().hide();            
            }
            
            //From the archives -------------------------------
            html = '';
            fval = that.recset.values(person, 135); //photo
            if(!$.isArray(fval))  fval = [];
            var fval2 = that.recset.values(person, 144); //docs
            if(!$.isArray(fval2))  fval2 = [];
            fval = fval.concat(fval2)
            
            if($.isArray(fval)){
                idx = 0;
                for (idx in fval)
                if(!that.isempty(fval)){
                    var record = that.recset.getById(fval[idx]);
                    var filename = that.recset.fld(record, 62);
                    var obf = that.recset.fld(record, 38);
                    var stitle = (that.recset.fld(record, 'rec_RecTypeID')==144)?'Document scan':('Photograph of '+fullName);
                    
                    html = html + 
                        '<a class="bor-gallery-link" data-toggle="lightbox" data-gallery="profile-images" data-title="'
                            + filename + '" data-footer="" title="'+ filename +'" href="'
                            + window.hWin.HAPI4.baseURL+'redirects/file_download.php?db=' + window.hWin.HAPI4.database 
                            + '&id=' + obf[0] +'">'
                            + '<img class="bor-thumbnail" src="' 
                            + window.hWin.HAPI4.baseURL+'redirects/file_download.php?db=' + window.hWin.HAPI4.database 
                            + '&thumb=' + obf[0]
                            + '" alt="'+stitle+'">'
                        +'</a>';                    
                }
            }
            
            if(that.isempty(html)){
                $('#p_gallery').parent().hide();            
            }else{
                html = html + '<p class="help-block">'
                + 'Unless otherwise noted, these photographs, War Service Records, letters, diaries and cards were sent to the'      
                + 'University by family and friends during and after World War One. If you have any material to add, please see our '
                + '<a href="/contribute" onclick="{window.hWin.boroResolver(event);}">contribute page</a>.</p>';
               
                
                $('#p_gallery').parent().show();            
                $('#p_gallery').empty().append($(html));            
            }
            
            //Timeline -------------------------------
            /*
            thumb
            birth
            early edu
            tertiary at uni
            enlisted
            served as where
            awarded
            mentioned in dispetches twice
            married
            killed/death
            */
            html = '<li class="bor-stop bor-stop-large">';  
            if(that.recset.fld(person, 'rec_ThumbnailURL')){
                html =  html
                +'<div class="bor-stop-image" style="background-color: '+that.recset.fld(person, 'rec_ThumbnailBg')+';">'
                + '<img src="'+that.recset.fld(person, 'rec_ThumbnailURL')+'" height="65" alt="Photograph of '+fullName
                + '"></div>';
            }else{
                html =  html + '<div class="bor-stop-image bor-stop-image-placeholder"></div>';
            }
            html = html + '</li>';
            
            var head_of_item = '<li class="bor-stop">'
            +'<div class="bor-stop-label bor-tooltip" data-toggle="tooltip" data-placement="left" title="" data-original-title="Do you have information that will help us complete this timeline? Visit the contribute page to let us know.">';
            
            
            for(var k=0; k<timeline.length; k++){
                
                html = html + head_of_item + timeline[k].date + '</div><div class="bor-stop-description"><p>'
                            + timeline[k].description
                            + '</p></div></li>';
            }
            
            $('#p_timeline').empty().append($(html));    
            
            
            // MAPPING -------------------
            //get subset 
            if(mapids.length>0){
                
                //set rec_Icon according to type of event
            
                var map_recset = that.recset.getSubSetByIds(mapids);
                map_recset.setMapEnabled();
                
                var params = {id:'main',
                    title: 'Current query',
                    recordset: map_recset,
                    color: '#ff0000'
                };            
                $('#p_mapframe_container').show()
                var mapping = $('#p_mapframe')[0].contentWindow.mapping;
                if(mapping && mapping.map_control){
                    mapping.map_control.addRecordsetLayer(params);
                }
                
            }else{
                $('#p_mapframe_container').hide()  
            }
            /*
            //add new layer with given name
            var params = {id:'main',
                title: 'Current query',
                query: 'ids:'+mapids.join(','),
                color: '#ff0000'
            };            
            var mapping = $('#p_mapframe')[0].contentWindow.mapping;
            if(mapping && mapping.map_control){
                mapping.map_control.addQueryLayer(params);
            }
            */
                    
            
        }); //end for record response

        
    },
    
    //
    //utility functions ----------------------------------------------------------
    //
    //
    __composePersonName: function(record){
          
            var that = this;

            function fld(fldname){
                return that.recset.fld(record, fldname);
            }

            var fullName = fld(this.DT_GIVEN_NAMES);    
            if(this.isempty(fullName)){
                fullName = fld(this.DT_INITIALS);        
            }
            if(!this.isempty(fld(this.DT_HONOR))){
                fullName = this.__getTerm( fld(this.DT_HONOR) )+' '+fullName;
            }
            fullName = fullName + ' ' + fld(this.DT_NAME);
            return fullName;      
    },

    //
    //
    //
    __composePersonNameTag: function(record){
            var fullName = this.recset.fld(record, this.DT_GIVEN_NAMES)+ ' ' + this.recset.fld(record, this.DT_NAME);
            return fullName.trim().toLowerCase().replace(/ /g,'-');
        
    },
     
    //
    //
    //
    __getDate: function(rec, preferred_dty_ids){
                var date = null;
                if( $.isArray(preferred_dty_ids) && preferred_dty_ids.length>0 ){
                    for(var i=0;i<preferred_dty_ids.length;i++){
                        date = this.recset.fld(rec, preferred_dty_ids[i]);    
                        if(!this.isempty(date) && date!=0){
                            return date;
                        }
                    }
                    
                }else{
                    date = this.recset.fld(rec, this.DT_DATE);
                    if(this.isempty(date) || date==0){
                        date = this.recset.fld(rec, this.DT_START_DATE);
                    }
                }
                if(this.isempty(date) || date==0) date = '';
                return date;
    },
    
    __getYear: function(date, def){
                
                var year = def?def:'?';
                
                if(!this.isempty(date) && date!=0) {
                    year = Number(date.split('-')[0]);
                }
                return year;
    },
    
    __formatDate: function(val){
                if(!this.isempty(val)){
                    var tDate = TDate.parse(val);
                    var day = Number(tDate.getDay());
            
                    var res = (isNaN(day)||day<1||day>31?'':(day+' '))+tDate.toString('MMMM')+' '+Math.abs(tDate.getYear()); 
                    return res.trim();
                }else{
                    return '';
                }
    },
    
    __getEventDates: function(record){
                var sDate1 = this.__getDate(record, [this.DT_START_DATE]);
                var sDate2 = this.__getDate(record, [this.DT_END_DATE]);
                var sDate = '';
                
                if(!this.isempty(sDate2) && !this.isempty(sDate1)){
                    sDate = ' from '+this.__formatDate(sDate1)+' to '+this.__formatDate(sDate2);
                }else if (!this.isempty(sDate1)) {
                    sDate = ' ' + this.__formatDate(sDate1);  //' since '+
                }else if (!this.isempty(sDate2)) {
                    sDate1 = sDate2;
                    sDate = ' till '+this.__formatDate(sDate2);
                }else{
                    sDate1 = this.__getDate(record, [this.DT_DATE]);
                    if (!this.isempty(sDate1)) {
                        sDate = ' on '+this.__formatDate(sDate1);
                    }
                }

                
                return {date:sDate1,desc:sDate};
    },
    
    //-----------------------------------------
    //
    //
    __getTerm: function(termID){
                var res = '';
                if(termID>0){
                    res = window.hWin.HEURIST4.ui.getTermValue(termID);
                    if(res.indexOf('not found')==0) res = '';
                }
                return res;
    },
    
    __joinAnd: function(res){
        
                if(res.length>1){
                    var last = res.pop();
                    return res.join(', ')+' and '+last;
                }else if(res.length>0){
                    return res[0];
                }else{
                    return '';
                }
    },
      
    //
    //
    //
    __getEduInst: function( record ){
        
        var edu_rec_id  = this.recset.fld(record, this.DT_INSTITUTION);
        var edu_record = this.recset.getById( edu_rec_id ); 
        var sEduName = this.recset.fld(edu_record, this.DT_NAME);
        return '<a href="'
                    + window.hWin.HAPI4.baseURL+'institution/'
                    + edu_rec_id +'/a" onclick="{window.hWin.boroResolver(event);}">'
                    + sEduName+'</a>';
    },
      
    //      
    // detail 0 - name, state, country, 1 - state, country
    // returns {ids:[], names, link: }
    //
    // in military service this is repeatable field
    //
    __getPlace: function(rec, details){
        
                var rt = this.recset.fld(rec, 'rec_RecTypeID');
                var places = [];
                if(rt==this.RT_GEOPLACE){
                    places = [rec];
                }else{
                    places = this.recset.values(rec, this.DT_PLACE);    
                }
                
                var idx = 0;
                var sRes = '';
                var aRes = [];
                var place_ids = [];
                var place_names = [];
                
                if($.isArray(places)){
                    for (idx in places){
                        
                        var placeID, place_rec = null;
                        if(rt==this.RT_GEOPLACE){
                            place_rec = places[idx];
                            placeID = this.recset.fld(rec, 'rec_ID');
                        }else {
                            placeID = places[idx];
                            if(placeID>0){
                                place_rec = this.recset.getById(placeID);
                            }
                        }
                            
                        if(place_rec){
                                place_ids.push(placeID);
                                
                                var placename = this.recset.fld(place_rec, this.DT_NAME); //place name
                                var state = this.recset.fld(place_rec, 2); //state
                                var country = this.__getTerm(this.recset.fld(place_rec, 26));
                                var res = [];
                                if(details==0 && country!=placename){
                                    res.push(placename);
                                }
                                if(state)res.push(state);
                                if(country)res.push(country);
                                
                                var fullName = res.join(', ');
                                place_names.push(fullName);
                           
                                aRes.push('<a href="'+window.hWin.HAPI4.baseURL+'place/'
                                    + placeID
                                    + '/a" onclick="{window.hWin.boroResolver(event);}">'
                                    + fullName + '</a>');
                        }
                    }
                    
                    sRes = this.__joinAnd(aRes);
                }

                return {ids:place_ids, names:place_names, link:sRes};
                
    },


    __setPlaceDesc: function(place, icon, description){

        for(var i=0;i<place.ids.length;i++){
            var place_rec = this.recset.getById(place.ids[i]);
            if(place_rec){
                
                if(description){
                    this.recset.setFld(place_rec, 'rec_Title', 
                        '<div class="bor-map-infowindow-heading">'+description+'</div>'+
                        '<div class="bor-map-infowindow-description">'+place.names[i]+'</div>'
                    );   
                }
                
                if(icon) {
                    var iconPath = window.hWin.HAPI4.baseURL + 'hclient/widgets/boro/bundles/markers/';
                    this.recset.setFld(place_rec, 'rec_Icon', iconPath+icon+'.png');   
                }
                                
                
            }
        }

    },
    
    //
    //subsctibe form 
    //
   _doSubsribeNewsLetter: function( edit_form ){

              
        var that = this;
        var allFields = edit_form.find('input');
        var err_text = '';

        // validate mandatory fields
        allFields.each(function(){
            var input = $(this);
            if(input.attr('required')=='required' && input.val()=='' ){
                input.addClass( "ui-state-error" );
                err_text = err_text + ', '+edit_form.find('label[for="' + input.attr('id') + '"]').html();
            }
        });
        
        //verify captcha
        //remove/trim spaces
        var ele = edit_form.find("#captcha");
        var val = ele.val().trim().replace(/\s+/g,'');
        
        var ss = window.hWin.HEURIST4.msg.checkLength2( ele, '', 1, 0 );
        if(ss!=''){
            err_text = err_text + ', Humanity check';
        }else{
            ele.val(val);
        }

        if(err_text==''){
            // validate email
            // 
            var email = edit_form.find("#newsletter_type_email");
            var bValid = window.hWin.HEURIST4.msg.checkEmail(email);
            if(!bValid){
                err_text = err_text + ', '+window.hWin.HR('Email does not appear to be valid');
            }
            if(err_text!=''){
                err_text = err_text.substring(2);
            }


        }else{
            err_text = window.hWin.HR('Missing required field(s)')+': '+err_text.substring(2);
        }

        if(err_text==''){

            var newsletter_type_name = edit_form.find('#newsletter_type_name').val()
            var newsletter_type_email = edit_form.find('#newsletter_type_email').val()
            
            var details = {};
                details['t:'+that.DT_NAME] = [ newsletter_type_name ];
                details['t:23'] = [ newsletter_type_email ];
            

            var request = {a: 'save', 
                    db: window.hWin.HAPI4.database+'_Signups',
                    ID:-1, //new record
                    RecTypeID: that.RT_PERSON,
                    RecTitle: newsletter_type_name+' ('+newsletter_type_email+')',
                    Captcha: edit_form.find("#captcha").val(),
                    details: details };     
                    
            window.hWin.HAPI4.RecordMgr.save(request, 
                    function(response){
                        var  success = (response.status == window.hWin.HAPI4.ResponseStatus.OK);
                        if(success){
                           //window.hWin.HEURIST4.msg.showMsgDlg("Thank you for signing up with our newsletter");
                           $('.newsletter-form').hide();
                           $('.bor-home-subscribe').append($('<label>Thank you for signing up with our newsletter</label>'))
                        }else{
                            window.hWin.HEURIST4.msg.showMsgErr(response);

                            edit_form.find("#captcha").val('');
                            that._refreshCaptcha(edit_form);
                        }
                    }
                );

        }else{
            window.hWin.HEURIST4.msg.showMsgErr(err_text);
        }

    },
    
    _refreshCaptcha: function(edit_form){
        
        edit_form.find('#captcha').val('');
        var $dd = edit_form.find('#captcha_img');
        var id = window.hWin.HEURIST4.util.random();
        if(true){  //simple captcha
            $dd.load(window.hWin.HAPI4.baseURL+'hserver/utilities/captcha.php?id='+id);
        }else{ //image captcha
            $dd.empty();
            $('<img src="'+window.hWin.HAPI4.baseURL+'hserver/utilities/captcha.php?img='+id+'"/>').appendTo($dd);
        }
        
        
    }    
    
     
     
});



//
// global function
//
function boroResolver(event){

    var url;
        
    if($(event.target).is('a')){
        url = $(event.target).attr('href');
    }else{
        var ele = $(event.target).parents('a');
        url = ele.attr('href');
    } 
    
    var params = url.split('/');
    if(params.length>2){
        var recID = params[params.length-2];
        var type = params[params.length-3];
        
        window.hWin.HEURIST4.util.stopEvent(event);
        
       if(recID>0 || (type=='military-service' && recID) ){

            var app1 = window.hWin.HAPI4.LayoutMgr.appGetWidgetByName('boro_nav');
            if(app1 && app1.widget){
                $(app1.widget).boro_nav({entityType:type, entityID:recID});    
            }              
             
           /*
           if(type=='place'){
                //@todo?? move all functionality of boro_place to boro_nav??? 
                var app1 = window.hWin.HAPI4.LayoutMgr.appGetWidgetByName('boro_place');
                if(app1 && app1.widget){
                    var hdoc = $(window.hWin.document);
                    hdoc.find('#main_pane > .clearfix').hide();
                    hdoc.find('.bor-page-place').show();
                    hdoc.scrollTop(0);
                    $(app1.widget).boro_place('option', 'placeID', recID);    
                }
           }else{
           }*/
       }
    }else if(params.length>1){
        var page_name = params[params.length-1];
        if(page_name){
            window.hWin.HEURIST4.util.stopEvent(event);
            var app1 = window.hWin.HAPI4.LayoutMgr.appGetWidgetByName('boro_nav');
            if(app1 && app1.widget){
                $(app1.widget).boro_nav({page_name:page_name});    
            }              
        }
    }   
}
