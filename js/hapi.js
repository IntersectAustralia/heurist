/**
* Main class for Heurist API
*
* Constructor:
* @param _db - database name, if omit it takes from url parameter
* @param _oninit - callback function, obtain parameter true if initialization is successeful
* @returns hAPI Object
*
* @package     Heurist academic knowledge management system
* @link        http://HeuristNetwork.org
* @copyright   (C) 2005-2015 University of Sydney
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


function hAPI(_db, _oninit) { //, _currentUser
    var _className = "HAPI",
    _version   = "0.4",
    _database = null, //same as public property  @toremove      s
    _region = 'en',
    _regional = null, //localization resources
    _guestUser = {ugr_ID:0, ugr_FullName:'Guest' };



    /**
    * initialization of hAPI object
    *  1) define paths from top.location
    *  2) takes regional from  localization.js
    *
    * @param _db - database name, if omit it takes from url parameter
    * @param _oninit - callback function, obtain parameter true if initialization is successeful
    *
    */
    function _init(_db, _oninit){ //, _currentUser) {
        //@todo - take  database from URL
        if(_db){
            _database = _db;
        }else{
            _database = top.HEURIST4.util.getUrlParameter('db');
        }

        //
        var installDir = top.location.pathname.replace(/(((\?|admin|applications|apps|assets|common|context_help|export|ext|external|hapi|help|import|js|page|php|records|redirects|search|viewers)\/.*)|(index.*))/, ""); // Upddate in 3 places if changed
        that.basePathV4 = top.location.protocol + '//'+top.location.host + installDir;
        // TODO: This is actually a proto URL rather than a base URL. Rename.
        that.iconBaseURL= that.basePathV4 + 'php/common/rt_icon.php?db='+_database+'&id=';
        // TODO: why is this todo? Explain or delete
        //top.location.protocol + '//'+top.location.host+'/HEURIST_FILESTORE/'+_database+'/rectype-icons/';      //todo!!!!
        that.database = _database;

        //path to old interface - it will be get from server sysinfo
        installDir = top.location.pathname.replace(/(((\?|admin|applications|common|export|external|hapi|help|import|records|search|viewers)\/.*)|(index.*))/, "");
        that.basePathV3 = top.location.protocol + '//'+top.location.host  + installDir;

        //global variable defined in localization.js
        if(!(typeof regional === 'undefined')){
            _regional = regional;
            /*todo
            $.getScript(that.basePathV4+'js/localization.js', function() {
            _regional = regional;
            });
            */
        }

        if(typeof hLayout !== 'undefined' && $.isFunction(hLayout)){
            that.LayoutMgr = new hLayout();
        }
        if(typeof hSearchMinimal !== 'undefined' && $.isFunction(hSearchMinimal)){
            that.SearchMgr = new hSearchMinimal();
        }


        /*if(_currentUser){
        that.currentUser = _currentUser;
        }else{}*/

        if(that.database){

            // Get current user if logged in, and global database settings
            that.SystemMgr.sys_info(
                function(response){
                    var  success = (response.status == top.HAPI4.ResponseStatus.OK);
                    if(success){
                        that.setCurrentUser(response.data.currentUser);
                        that.sysinfo = response.data.sysinfo;
                        that.basePathV3 = that.sysinfo['basePathV3'];
                    }else{
                        top.HEURIST4.util.showMsgErr(response.message);
                    }
                    if(_oninit){
                        _oninit(success);
                    }
                }
            );

        }else if(_oninit){
            _oninit( false );
        }

    }

    /*
    * internal function see hSystemMgr, hRecordMgr - ajax request to server
    *
    * @param action   - name of php script in php/api foolder on server side
    * @param request - data to be sent to server side
    * @param callback - callback function, it obtains object with 2 properties:
    *       status - see ResponseStatus
    *       message - ajax response or error message
    */
    function _callserver(action, request, callback){

        if(!request.db){
            request.db = _database;
        }
        if(request.notes){
            request.notes = null; //unset to reduce traffic
        }

        var url = that.basePathV4+"php/api/"+action+".php"; //+(new Date().getTime());

        //top.HEURIST4.ajax.getJsonData(url, callback, request);

        //note jQuery ajax does not properly in the loop - success callback does not work often
        $.ajax({
            url: url,
            type: "POST",
            data: request,
            dataType: "json",
            cache: false,
            error: function( jqXHR, textStatus, errorThrown ) {

                var response = {status:top.HAPI4.ResponseStatus.UNKNOWN_ERROR, message: jqXHR.responseText }
                //_processerror(response);

                if(callback){
                    callback(response);
                }
                //message:'Error connecting server '+textStatus});
            },
            success: function( response, textStatus, jqXHR ){

                //_processerror(response);

                if(callback){
                    callback(response);
                }
            }
        });

    }

    // TODO: Remove, enable or explain
    /**
    * User class
    *
    * @returns {Object}
    function hUserMgr(){

    var _currentUser = null,
    _guestUser = {ugr_ID:0, ugr_FullName:'Guest'};

    var that = {

    // request {username: , password: }
    // response HUser object
    login: function(request, callback){
    if(request) request.a = 'login';
    _callserver('usr_info', request, callback);
    }

    ,logout: function(callback){
    _callserver('usr_info', {a:'logout'}, callback);
    }
    }
    }
    */


    /**
    * System class that responsible for interaction with server in domains:
    *       user/groups information/credentials
    *       database definitions - record structure, field types, terms
    *       saved searches
    *
    * see usr_info.php and sys_structure.php
    *
    * methods:
    *   login        - login and get current user info
    *   logout
    *   reset_password
    *   sys_info     - get current user info and database settings
    *   save_prefs   - save user preferences  in session
    *   mygroups     - description of current Workgroups
    *   ssearch_get  - get saved searches for current user and all usergroups where user is memeber
    *   ssearch_save - save saved search in database
    *   ssearch_delete - delete saved searches by IDs
    *   ssearch_savetree - save saved search treeview data
    *   ssearch_gettree - get saved search treeview data
    *   get_defs     - get the desired database structure definition
    *
    * @returns {Object}
    */
    function hSystemMgr(){

        var that = {

            /**
            * Log in
            *
            * @param request - object {username: , password: }
            * @param callback - callback function with response parameter HUser object
            */
            login: function(request, callback){
                if(request) request.a = 'login';
                _callserver('usr_info', request, callback);
            }

            ,reset_password: function(request, callback){
                if(request) request.a = 'reset_password';
                _callserver('usr_info', request, callback);
            }

            /**
            * Log out
            */
            ,logout: function(callback){
                _callserver('usr_info', {a:'logout'}, callback);
            }

            /**
            * Get current user if logged in, and global database settings
            */
            ,sys_info: function(callback){
                _callserver('usr_info', {a:'sysinfo'}, callback);
            }

            /**
            * Save user profile info in db
            * @param request
            * @param callback
            */
            ,user_save: function(request, callback){
                if(request) request.a = 'usr_save';
                _callserver('usr_info', request, callback);
            }

            /**
            * Get user profile info form db - used in Admin part only?
            * @param request
            * @param callback
            */
            ,user_get: function(request, callback){
                if(request) request.a = 'usr_get';
                _callserver('usr_info', request, callback);
            }

            /**
            * Save user personal info/register new user
            * @param request - object - user info
            * @param callback
            */
            ,save_prefs: function(request, callback){
                if(request) request.a = 'save_prefs';
                _callserver('usr_info', request, callback);
            }

            /**
            * Returns detailed description of groupfs for current user
            *
            * response data - array of ugl_GroupID:[ugl_Role, ugr_Name, ugr_Description]
            */
            ,mygroups: function(callback){
                _callserver('usr_info', {a:'groups'}, callback);
            }

            /**
            *  Get saved searched for current user and all usergroups where user is memeber
            *
            * request
            *    UGrpID: group id -  if not defined returns all saved searches for current user
            *  response data - array of  svs_ID:[svs_Name, svs_Query, svs_UGrpID]
            */
            ,ssearch_get: function(request, callback){
                if(!request) request = {};

                request.a = 'svs_get';
                _callserver('usr_info', request, callback);
            }

            /**
            *  Save saved search in database
            *
            *  request - object
            *   svs_ID (not specified if ADD new search)
            *   svs_Name - name
            *   svs_Query - heurist query
            *   svs_UGrpID - user/group ID
            */
            ,ssearch_save: function(request, callback){
                if(request) request.a = 'svs_save';
                _callserver('usr_info', request, callback);
            }

            /**
            * Delete saved searches by IDs
            * request : {ids: list of records to be deleted}
            */
            ,ssearch_delete: function(request, callback){
                if(request) request.a = 'svs_delete';
                _callserver('usr_info', request, callback);
            }

            ,ssearch_savetree: function(request, callback){
                if(request) request.a = 'svs_savetree';
                _callserver('usr_info', request, callback);
            }

            ,ssearch_gettree: function(request, callback){
                if(request) request.a = 'svs_gettree';
                _callserver('usr_info', request, callback);
            }
            /**
            *  Get the desired database structure definition
            * request
            *   terms, rectypes, detailtypes :  list of desired ids,  OR 'all'
            *   mode: applied for rectypes  0 only names (default), 1 only strucuture, 2 - both, 3 - all,   4 - for faceted search(with type names)
            *
            */
            ,get_defs: function(request, callback){
                _callserver('sys_structure', request, callback);
            }

            /*
            ,databases: function(request, callback){
            _callserver('sys_databases', request, callback);
            }*/
        }
        return that;
    }

    /**
    * System class that responsible for record's edit, search and tags
    *
    * see record_edit.php, record_tags.php and record_search.php
    *
    * methods:
    *   add       - creates new temporary record
    *   save      - save record
    *   remove    - delete record
    *
    *   search
    *   minmax
    *   get
    *
    *   tag_save
    *   tag_delete
    *   tag_get
    *   tag_set
    *   tag_replace
    *   tag_rating
    *
    *   file_save
    *   file_delete
    *   file_get
    *
    * @returns {Object}
    */
    function hRecordMgr(){

        var that = {

            /**
            * Creates temporary new record
            *
            * @param request a: a|add
            *      optional  rt - rectype, ro - owner,  rv - visibility
            * @param callback - response hRecordSet object
            */
            add: function(request, callback){
                if(request){
                    request.a = 'a';
                }else{
                    request = { a:'a' };
                }
                _callserver('record_edit', request, callback);
            }

            /**
            *  Save Record (remove temporary falg if new record)
            *
            * @param request a: s|save
            * @param callback - response hRecordSet object
            */
            ,save: function(request, callback){
                if(request) request.a = 's';
                _callserver('record_edit', request, callback);
            }

            /**
            * Remove Record
            *
            * @param request a: d|delete
            *               ids: list of records to be deleted
            * @param callback
            */
            ,remove: function(request, callback){
                if(request) request.a = 'd';
                _callserver('record_edit', request, callback);
            }

            /**
            * Search for records
            *
            * request { }
            *  q - query string
            *  w - a|b - domain all or bookmarks
            *  f - none or cs list detail,map,structure,tags,relations,(backward)links,text,comments - details of output
            *  limit - limit
            *  o - offset
            *
            *  callback - callback function or  $document we have trigger the event
            */
            ,search: function(request, callback){


                if(!$.isFunction(callback)){   //@todo - remove all this stuff since it is implemented in SearchMgr

                    if(!request.increment || top.HEURIST4.util.isnull(request.id)){
                        request.id = Math.round(new Date().getTime() + (Math.random() * 100));
                    }

                    var document = callback;
                    if(!top.HEURIST4.util.isnull(document) && !request.increment){
                        document.trigger(top.HAPI4.Event.ON_REC_SEARCHSTART, [ request ]); //global app event
                    }

                    callback = function(response)
                    {
                        var resdata = null;
                        if(response.status == top.HAPI4.ResponseStatus.OK){
                            resdata = new hRecordSet(response.data);
                        }else{

                            top.HEURIST4.util.showMsgErr(response);

                            if(!top.HEURIST4.util.isnull(document)){
                                document.trigger(top.HAPI4.Event.ON_REC_SEARCH_FINISH, null); //global app event
                            }
                        }
                        if(!top.HEURIST4.util.isnull(document)){
                            document.trigger(top.HAPI4.Event.ON_REC_SEARCHRESULT, [ resdata ]);  //gloal app event
                        }
                    }
                }


                //if limit is not defined - get it from preferences
                if(top.HEURIST4.util.isnull(request.limit)){
                    request.limit = top.HAPI4.get_prefs('search_limit');
                }

                // start search
                _callserver('record_search', request, callback);    //standard search

            }


            /**
            * Search relation within given set of records
            *
            * request { }
            *  ids - list of record ids
            *
            *  callback - callback function or  $document we have trigger the event
            */
            ,search_related: function(request, callback){
                if(request) request.a = 'related';
                _callserver('record_search', request, callback);    //standard search
            }


            // find min and max values for
            // rt - record type
            // dt - detailtyep
            ,minmax: function(request, callback){
                if(request) request.a = 'minmax';
                _callserver('record_search', request, callback);
            }

            // find ranges for faceted search
            //
            ,get_facets: function(request, callback){
                if(request && !request.a) request.a = 'getfacets';
                _callserver('record_search', request, callback);
            }

            //@TODO get full info for particular record
            ,get: function(request, callback){
                _callserver('record_get', request, callback);
            }

            // add/save tag
            // request  a: save
            //          tag_ID (not specified if ADD)
            //          tag_Text
            //          tag_Description
            //          tag_UGrpID
            ,tag_save: function(request, callback){
                if(request) request.a = 'save';
                _callserver('record_tags', request, callback);
            }
            // remove tag
            // request  a: delete
            //          ids - list of tag ids to be deleted
            ,tag_delete: function(request, callback){
                if(request) request.a = 'delete';
                _callserver('record_tags', request, callback);
            }
            // get list of tags for sepcified userid
            // request  a: search
            //          UGrpID
            //          recIDs - record ids
            //          info - full or short
            // responce  recIDs
            //
            ,tag_get: function(request, callback){
                if(request) request.a = 'search';
                _callserver('record_tags', request, callback);
            }
            // assign/remove list of tags for sepcified list of records
            // request  a: assign_remove
            //          assign: cs list of tag ids to be assigned
            //          remove: tags to be removed from records
            //          recIDs: cs list of record ids
            //          UGrpID
            ,tag_set: function(request, callback){
                if(request) request.a = 'set';
                _callserver('record_tags', request, callback);
            }

            // remove tag
            // request  a: replace
            //          ids - list of tag ids to be replaced and deleted
            //          new_id - new tag id
            ,tag_replace: function(request, callback){
                if(request) request.a = 'replace';
                _callserver('record_tags', request, callback);
            }

            // asign rating for given set of bookmarked records
            // request  a: rating
            //          ids - list of tag ids to be replaced and deleted
            //          new_id - new tag id
            ,tag_rating: function(request, callback){
                if(request) request.a = 'rating';
                _callserver('record_tags', request, callback);
            }



            // add/save file
            // request  a: save
            //          ulf_ID (not specified if ADD)
            //          ulf_OrigFileName
            //          ulf_Description
            //          ulf_UploaderUGrpID
            //          ulf_ExternalFileReference
            ,file_save: function(request, callback){
                if(request) request.a = 'save';
                _callserver('record_files', request, callback);
            }
            // remove file
            // request  a: delete
            //          ids - list of file ids to be deleted
            ,file_delete: function(request, callback){
                if(request) request.a = 'delete';
                _callserver('record_files', request, callback);
            }
            // get list of files for sepcified userid, media type and records
            // request  a: search
            //          UGrpID
            //          mediaType
            //          recIDs
            ,file_get: function(request, callback){
                if(request) request.a = 'search';
                _callserver('record_files', request, callback);
            }


        }
        return that;
    }

    /**
    * Localization
    *
    * Returns string resouce according to current region setting
    */
    function _key(res){
        if(_regional && _regional[_region] && _regional[_region][res]){
            return _regional[_region][res];
        }else{
            return res;
        }
    }

    //public members
    var that = {

        basePathV4: '',
        basePathV3: '', //base path for old interface
        iconBaseURL: '',
        database: '',

        ResponseStatus: {
            INVALID_REQUEST: "invalid",    // The Request provided was invalid.
            NOT_FOUND: "notfound",         // The requested object not found.
            OK: "ok",                      // The response contains a valid Result.
            REQUEST_DENIED: "denied",      // The webpage is not allowed to use the service.
            DB_ERROR: "database",          // A request could not be processed due to a server database error. Most probably this is BUG. Contact developers
            UNKNOWN_ERROR: "unknown",      // A request could not be processed due to a server error. The request may succeed if you try again.
            SYSTEM_CONFIG: "syscfg", // System NON-fatal configuration. Contact system admin
            SYSTEM_FATAL: "system"           // System fatal configuration. Contact system admin
        },

        Event: {
            LOGIN: "LOGIN",
            LOGOUT: "LOGOUT",
            ON_REC_SEARCHSTART: "ON_REC_SEARCHSTART",
            ON_REC_SEARCH_FINISH: "ON_REC_SEARCH_FINISH",
            ON_REC_SEARCHRESULT: "ON_REC_SEARCHRESULT",
            //ON_REC_SEARCHTERMINATE: "ON_REC_SEARCHTERMINATE",
            ON_REC_PAGESET: "ON_REC_PAGESET",
            ON_REC_SELECT: "ON_REC_SELECT",
            ON_LAYOUT_RESIZE: "ON_LAYOUT_RESIZE",
            ON_SYSTEM_INITED: "ON_SYSTEM_INITED"
        },

        /**
        * Assign user after system initialization - obtained from server side by SystemMgr.sys_info
        *
        * @param user
        */
        setCurrentUser: function(user){
            if(user){
                that.currentUser = user;
            }else{
                that.currentUser = _guestUser;
            }
        },

        /**
        * Returns true if currentUser ID > 0 (not guest)
        */
        is_logged: function(){
            return that.currentUser['ugr_ID']>0;
        },

        /**
        * Returns true is current user is database owner
        */
        is_admin: function(){
            return that.currentUser['ugr_Admin'];
        },

        /**
        * Returns true if currentUser is member of given group ID or itself  (similar on server is_admin2)
        * @param ug
        */
        is_member: function(ug){
            return (ug==0 || that.currentUser['ugr_ID']==ug ||
                (that.currentUser['ugr_Groups'] && that.currentUser['ugr_Groups'][ug]));
        },

        /**
        * Return userGroup ID if currentUser is database owner or admin of given group
        *
        * @param ugrID - userGroup ID
        */
        has_access: function(ugrID){

            if(!ugrID){
                ugrID = that.currentUser['ugr_ID'];
            }
            if(ugrID==that.currentUser['ugr_ID'] || that.is_admin() ||
                (that.currentUser['ugr_Groups'] && that.currentUser['ugr_Groups'][ugrID]=="admin"))
            {
                return ugrID;
            }else{
                return -1;
            }
        },

        /**
        * Returns current user preferences
        *
        * @returns {Object}
        */
        get_prefs: function(name){
            if( !that.currentUser['ugr_Preferences'] ) {
                //preferences by default
                that.currentUser['ugr_Preferences'] = {layout_language:'en', layout_theme:'heurist', 'search_limit':1000, 'help_on':'0'};
            }
            if(top.HEURIST4.util.isempty(name)){
                return that.currentUser['ugr_Preferences'];
            }else{
                var res = that.currentUser['ugr_Preferences'][name]
                if(!res && 'search_limit'==name) res = 1000;
                return res;
            }
        },

        is_ui_normal: function(){
            return (top.HAPI4.get_prefs('layout_style')=='normal');
        },

        currentUser: _guestUser,
        sysinfo: {},

        currentRecordset: null,

        getClass: function () {return _className;},
        isA: function (strClass) {return (strClass === _className);},
        getVersion: function () {return _version;},


        //UserMgr: new hUserMgr(),

        SystemMgr: new hSystemMgr(),

        /*SystemMgr: function(){
        return hSystemMgr();
        },*/

        RecordMgr: new hRecordMgr(),

        //@todo - assign it later since we may have different search managers - incremental, partial...
        //SearchMgr: new hSearchIncremental(), //class that responsible for search and incremental loading of result
        SearchMgr: null, //class that responsible for search and incremental loading of result

        LayoutMgr: null,

        /*RecordMgr: function(){
        return hRecordMgr();
        }*/

        /**
        * Returns function to string resouce according to current region setting
        */
        setLocale: function( region ){
            if(_regional && _regional[region]){
                _region = region;
            }
            return _key;  //_key is function
        }

        /**
        *   if needIds is true  it returns array of record ids
        */
        , getSelection: function(selection, needIds){

            if (selection == "all") {
                if(this.currentRecordset){
                    selection = needIds ?this.currentRecordset.getIds() :this.currentRecordset;
                }else{
                    return null;
                }
            }
            if( selection ) {
                if( (typeof selection.isA == "function") && selection.isA("hRecordSet") ){
                    if(selection.length()>0){
                        return (needIds) ?selection.getIds():selection; //array of record ids
                    }
                }else{
                    return (needIds) ?selection
                    :((that.currentRecordset)?that.currentRecordset.getSubSetByIds(selection):null);
                }
            }
            return null;
        }
    }

    _init(_db, _oninit); //, _currentUser);
    return that;  //returns object
}