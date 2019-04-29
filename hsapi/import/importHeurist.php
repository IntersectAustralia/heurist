<?php

/**
* ImportHeurist.php - import records and definitions from Heurist exchange json or xml file
*
* @package     Heurist academic knowledge management system
* @link        http://HeuristNetwork.org
* @copyright   (C) 2005-2019 University of Sydney
* @author      Artem Osmakov   <artem.osmakov@sydney.edu.au>
* @author      Ian Johnson     <ian.johnson@sydney.edu.au>
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


require_once(dirname(__FILE__)."/../../admin/verification/verifyValue.php");
require_once(dirname(__FILE__)."/../../hsapi/dbaccess/db_records.php");

class ImportHeurist {

    private function __construct() {}    
    private static $system = null;
    private static $mysqli = null;
    private static $initialized = false;
    
private static function initialize($fields_correspondence=null)
{
    if (self::$initialized)
        return;

    global $system;
    self::$system  = $system;
    self::$mysqli = $system->get_mysqli();
    self::$initialized = true;
}

/**
* Reads import file 
* 
* detect format
* if xml coverts to json
* 
* @param mixed $filename - archive or temp  import file
* @param mixed $type - type of file manifest of record data
*/
private static function readDataFile($filename, $type=null, $validate=true){
   
   $data=null;
    try{
        $filename = HEURIST_SCRATCH_DIR.$filename;
        
        if(!file_exists($filename)){
            
            self::$system->addError(HEURIST_ACTION_BLOCKED, 'Import file doesn\'t exist');
        }else
        if(!is_readable($filename))
        {
            self::$system->addError(HEURIST_ACTION_BLOCKED, 'Import file is not readable. Check permissions');
        }else
        {     
            
            if(isXMLfile($filename)){

                $data = self::hmlToJson($filename);
                
//debug error_log( json_encode($data) );
                
            }else{
                
                $content = file_get_contents($filename);
                $data = json_decode($content, true);
            }
            
            
            if($validate){
                $imp_rectypes = @$data['heurist']['database']['rectypes'];
                if($data==null || !$imp_rectypes){
                    self::$system->addError(HEURIST_ACTION_BLOCKED, 'Import data has wrong data. "Record type" section is not found');
                }
            }
            
        }
    } catch (Exception  $e){
        $data = null;
    }   
    
    return $data;
}

//
// @todo use XMLReader 
//
private static function hmlToJson($filename){

    $xml_doc = simplexml_load_file($filename);
    if($xml_doc==null || is_string($xml_doc) || !$xml_doc->database){
        self::$system->addError(HEURIST_ACTION_BLOCKED, 'It appears that xml is corrupted');
        return null;
    }
    
    $GEO_TYPES = array('bounds'=>'r', 'circle'=>'c' , 'polygon'=>'pl', 'path'=>'l' , 'point'=>'p', 'multi'=>'m');
    
    $db_attr = $xml_doc->database[0]->attributes();
    
    $json = array('heurist'=>array('records'=>array(), 'database'=>array(
            'id'=>''.$db_attr['id'],
            'db'=>''.$xml_doc->database,
            'url'=>''
        )));
    
    $db_url = null;
    
    $rectypes = array();
    
    $xml_recs = $xml_doc->records;
    if($xml_recs)
    {
            foreach($xml_recs->children() as $xml_rec){
                $rectype = $xml_rec->type->attributes();
                $rectype_id = ''.$rectype['id'];
                
                $record = array(
                    'rec_ID'=>''.$xml_rec->id,
                    'rec_RecTypeID'=>$rectype_id,
                    'rec_Title'=>''.$xml_rec->title,
                    'rec_URL'=>''.$xml_rec->url,
                    'rec_ScratchPad'=>''.$xml_rec->notes,
                    'rec_OwnerUGrpID'=>0, //''.$xml_rec->workgroup->id,  
                    'rec_NonOwnerVisibility'=>''.$xml_rec->visibility,
                    'rec_Added'=>''.$xml_rec->added,
                    'rec_Modified'=>''.$xml_rec->modified,
                    'rec_AddedByUGrpID'=>0 //$xml_rec->workgroup->id
                );
                
                if(!@$rectypes[$rectype_id]){
                    $rectypes[$rectype_id] = array(
                        'name'=>''.$xml_rec->type,
                        'code'=>''.$rectype['conceptID'],
                        'count'=>1
                    );
                }else{
                    $rectypes[$rectype_id]['count']++;
                }
                
                if($db_url==null){
                    $db_url = ''.$xml_rec->citeAs; 
                    $db_url = substr($db_url,0,strpos($db_url,'?'));
                }
                
                foreach($xml_rec->children() as $xml_det){
                    if ($xml_det->getName()=='detail')
                    {   
                       $dets = $xml_det->attributes();
                       $fieldtype_id = ''.$dets['id'];
                       $detail = ''.$xml_det;
                       
                       if($dets['isRecordPointer']=='true'){
                           /*$detail = array(
                            'id'=>$xml_det,
                            'type'=>'',
                            'title'=>''
                           );*/
                       }else if($xml_det->raw){
                           $detail = ''.$xml_det->raw;
                       }else if($dets['termID']){
                           $detail = ''.$dets['termID'];
                       }else if($xml_det->geo){
                           
                           $geotype = @$GEO_TYPES[ ''.$xml_det->geo->type ];
                           if(!$geotype) $geotype = ''.$xml_det->geo->type;
                           
                           $detail = array('geo'=>array(
                            'type'=>$geotype,
                            'wkt'=>''.$xml_det->geo->wkt
                           ));
                       }else if($xml_det->file){
                           $detail = array('file'=>array(
                            'ulf_ID'=>''.$xml_det->file->id,
                            //'fullPath'=> null,
                            'ulf_OrigFileName'=>''.$xml_det->file->origName,
                            //'ulf_ExternalFileReference'=>$xml_det->file->url,
                            'ulf_MimeExt'=>''.$xml_det->file->mimeType,
                            'ulf_ObfuscatedFileID'=>''.$xml_det->file->nonce,
                            'ulf_Description'=>''.$xml_det->file->description,
                            'ulf_Added'=>''.$xml_det->file->date
                           ),
                           'fileid'=>''.$xml_det->file->nonce);
                           
                           $file_url = ''.$xml_det->file->url;
                           if($file_url && strpos($file_url,$db_url)===false){
                                $detail['file']['ulf_ExternalFileReference'] = $file_url;
                           }
                       }
                       
                       if(!@$record['details'][$fieldtype_id]) $record['details'][$fieldtype_id] = array();
                       $record['details'][$fieldtype_id][] = $detail; 
                    }
                }
                
                $json['heurist']['records'][] = $record;

                
            }//records
    }       
    
    $json['heurist']['database']['url'] = $db_url;
    $json['heurist']['database']['rectypes'] = $rectypes;

    return $json;
}

/**
* returns list of definitions (record types to be imported)
* 
* It reads manifest files and tries to find all record types in current database by concept code. All record types from manifest file
* Returns local id for found records types, null otherwise
*
* @param mixed $filename
*/
public static function getDefintions($filename){
    
    self::initialize();

    $res = false;
    
    $data = self::readDataFile( $filename );
    
    if($data!=null){
        
        $database_defs = dbs_GetRectypeStructures(self::$system, null, 2);
        $database_defs = array('rectypes'=>$database_defs);
        
        $imp_rectypes = @$data['heurist']['database']['rectypes'];
        
        if($data==null || !$imp_rectypes){
            self::$system->addError(HEURIST_ACTION_BLOCKED, 'Import data has wrong data. "Record type" section is not found');
            return false;
        }
        
        
        foreach ($imp_rectypes as $rtid=>$rt){
            $conceptCode = $rt['code'];
            $local_id = DbsImport::getLocalCode('rectypes', $database_defs, $conceptCode, false);
            $imp_rectypes[$rtid]['target_RecTypeID'] = $local_id;
        }
        
        //return array of $imp_rectypes - record types to be imported
        $res = $imp_rectypes;
    }

    return $res;
}

//
// Imports missed record types (along with all dependencies). Uses dbsImport.php
//
public static function importDefintions($filename, $session_id){
    
    self::initialize();
    
    $res = false;
    
    //read manifest
    $data = self::readDataFile( $filename );
    
    if($data!=null){
        
        $imp_rectypes = $data['heurist']['database']['rectypes'];
        
        ini_set('max_execution_time', 0);
        $importDef = new DbsImport( self::$system );

//$time_debug = microtime(true);        
        
        if($importDef->doPrepare(  array(
                    'session_id'=>$session_id,
                    'defType'=>'rectype', 
                    'databaseID'=>@$data['heurist']['database']['id'], 
                    'definitionID'=>array_keys($imp_rectypes) )))
        {
            $res = $importDef->doImport();
        }

//if(_DBG) 
//error_log('prepare and import '.(microtime(true)-$time_debug));        
//$time_debug = microtime(true);        
        
        if(!$res){
            /*$err = self::$system->getError();
            if($err && $err['status']!=HEURIST_NOT_FOUND){
                self::$system->error_exit(null);  //produce json output and exit script
            }*/
        }else{
            //need to call refresh clinet side defintions
            $res = 'ok'; //$importDef->getReport(false);
        }

//error_log('report '.(microtime(true)-$time_debug));        
        
        return $res;
    }
    
    return $res;
}

//
//
//
public static function importRecords($filename, $session_id){
    
    self::initialize();
    
    $res = false;
    $cnt_imported = 0;
    
    $data = self::readDataFile( $filename );
    
    
    if($data!=null){

        $mysqli = self::$system->get_mysqli();
    
        $execution_counter = 0;
        
        $tot_count = count(@$data['heurist']['database']['records']);
        if($tot_count>0){
            $tot_count = $data['heurist']['records'];  
        } 
        
        if($session_id!=null){ //init progress
            mysql__update_progress($mysqli, $session_id, true, '0,'.$tot_count);
        }
            
        
        $imp_rectypes = $data['heurist']['database']['rectypes'];
        $source_url = $data['heurist']['database']['url']; //need to copy files
        $source_db = $data['heurist']['database']['db']; //need to copy files
        
        ini_set('max_execution_time', 0);
        $importDef = new DbsImport( self::$system );
        
        $res2 = $importDef->doPrepare(  array('defType'=>'rectype', 
                    'databaseID'=>@$data['heurist']['database']['id'], 
                    'definitionID'=>array_keys($imp_rectypes) ));
                    
        if(!$res2){
            $err = self::$system->getError();
            if($err && $err['status']!=HEURIST_NOT_FOUND){
                return false;
            }
            self::$system->clearError();  
        }  
        //get target definitions (this database)
        $defs = $importDef->getDefinitions();
        $def_dts  = $defs['detailtypes']['typedefs'];
        $idx_type = $def_dts['fieldNamesToIndex']['dty_Type'];
        
        $file_entity = new DbRecUploadedFiles(self::$system, null);
        $file_entity->setNeedTransaction(false);
        
        $records = $data['heurist']['records'];
        
        $records_corr = array(); //source rec id -> target rec id
        $resource_fields = array(); //source rec id -> field type id -> field value (source recid)
        
        $is_rollback = false;
        $keep_autocommit = mysql__begin_transaction($mysqli);    
        
        foreach($records as $record_src){
            
            if(!is_array($record_src) && $record_src>0){
                //this is record id - record data in the separate file
                //@todo
            }
        
            // prepare records - replace all fields, terms, record types to local ones
            // keep record IDs in resource fields to replace them later
            $record = array();
            $record['ID'] = 0; //add new
            $record['RecTypeID'] = $importDef->getTargetIdBySourceId('rectypes', $record_src['rec_RecTypeID']);
            $record['AddedByImport'] = 2; //import without strict validation
            $record['no_validation'] = true;
            $record['URL'] = @$record_src['rec_URL'];
            $record['URLLastVerified'] = @$record_src['rec_URLLastVerified'];
            $record['ScratchPad'] = @$record_src['rec_ScratchPad'];
            $record['Title'] = @$record_src['rec_Title'];
            
            $record['details'] = array();
            
            foreach($record_src['details'] as $dty_ID => $values){
                
                //field id in target database
                $ftId = $importDef->getTargetIdBySourceId('detailtypes', $dty_ID);
                
                $def_field = $def_dts[$ftId]['commonFields'];
                
                $new_values = array();
                if($def_field[$idx_type] == "enum" || 
                   $def_field[$idx_type] == "relationtype")
                {
                    foreach($values as $value){
                        //change terms ids for enum and reltypes
                        $new_values[] = $importDef->getTargetIdBySourceId($def_field[$idx_type], $value); 
                        //replaceTermIds( $value, $def_field[$idx_type] );
                    }
                }else if($def_field[$idx_type] == "geo"){
                    
                   foreach($values as $value){
                        $new_values[] = $value['geo']['type'].' '.$value['geo']['wkt'];
                   }
                   
                }else if($def_field[$idx_type] == "file"){
                    
                   //copy remote file to target filestore, register and get ulf_ID
                   foreach($values as $value){
                       
                       $tmp_file = null;
                       $value = $value['file'];
                       $dtl_UploadedFileID = null;
                       
                       if(@$value['ulf_ExternalFileReference']){ //remote URL
                           
                            if(@$value['ulf_ID']>0) $value['ulf_ID']=0;
                           
                            $fileinfo = array('entity'=>'recUploadedFiles', 'fields'=>$value);
                            
                            $file_entity->setData($fileinfo);
                            $file_entity->setRecords(null);
                            $dtl_UploadedFileID = $file_entity->save();   //it returns ulf_ID
                           
                       }else{
                            //download to scratch folder
                            $tmp_file = HEURIST_SCRATCH_DIR.$value['ulf_OrigFileName'];
                            
                            if(strpos($source_url, HEURIST_SERVER_URL)===0 && @$value['fullPath'])
                            {
                                if (file_exists(HEURIST_FILESTORE_ROOT.$source_db.'/'.$value['fullPath'])) {
                                    copy(HEURIST_FILESTORE_ROOT.$source_db.'/'.$value['fullPath'] , $tmp_file);
                                }
                            }
                            else
                            {
                                $remote_path = $file_URL = $source_url.'?db='.$source_db
                                        .'&file='.$value['ulf_ObfuscatedFileID']; //download
                                saveURLasFile($remote_path, $tmp_file);
                            }

                            if(file_exists($tmp_file))
                                $dtl_UploadedFileID = $file_entity->registerFile($tmp_file, null); //it returns ulf_ID
                       }

                       if($dtl_UploadedFileID!=null){
                            if($dtl_UploadedFileID===false){
                                $err_msg = self::$system->getError();
                                $err_msg = $err_msg['message'];
                                self::$system->clearError();  
                                $dtl_UploadedFileID = null;
                            }else{
                                $dtl_UploadedFileID = $dtl_UploadedFileID[0];
                                $new_values[] = $dtl_UploadedFileID;
                            }
                       }
                        
                       if($tmp_file && file_exists($tmp_file)){
                            unlink($tmp_file);    
                       }
                       
                       
                    }
                    
                }else if($def_field[$idx_type] == "resource"){ 
                   
                   $new_values = array(); 
                   //keep source record id to replace it to new target record id 
                   if(!@$resource_fields[$record_src['rec_ID']]){
                       $resource_fields[$record_src['rec_ID']] = array();
                   }
                   if(!@$resource_fields[$record_src['rec_ID']][$ftId]){
                       $resource_fields[$record_src['rec_ID']][$ftId] = array();
                   }
                   foreach($values as $value){
                       if(is_array($value)){
                            $resource_fields[$record_src['rec_ID']][$ftId][] = $value['id'];    
                            $new_values[] = $value['id'];
                       }else{
                           $resource_fields[$record_src['rec_ID']][$ftId][] = $value;    
                           $new_values[] = $value;
                       }
                   }
//"2552":{"7462":{"id":"1326","type":"98","title":"Record to imported","hhash":null}}}                   
                }else{
                       $new_values = $values;      
                }
                
                if(count($new_values)>0)
                    $record['details'][$ftId] = $new_values; 
            }
            
            $out = recordSave(self::$system, $record, false);  //see db_records.php

            if ( @$out['status'] != HEURIST_OK ) {
                //error_log('NOT SAVED');
                //error_log(print_r($record, true));
                $is_rollback = true;
                break;
            }
            
            $records_corr[$record_src['rec_ID']] = $out['data']; //new record id
            
            $execution_counter++;
        
            if($session_id!=null){
                $session_val = $execution_counter.','.$tot_count;
                //check for termination and set new value
                $current_val = mysql__update_progress($mysqli, $session_id, false, $session_val);
                if($current_val && $current_val=='terminate'){ //session was terminated from client side
                    //need rollback
                    self::$system->addError(HEURIST_ACTION_BLOCKED, 'Operation has been terminatated');
                    $is_rollback = true;
                    break;
                }
            }
            $cnt_imported++;
        }//records
        
        if(!$is_rollback){             
            //update resource fields with new record ids
            foreach ($resource_fields as $src_recid=>$fields){
                
                $trg_recid = @$records_corr[$src_recid];
                if($trg_recid>0)
                foreach ($fields as $fieldtype_id=>$old_values){
                    foreach ($old_values as $old_value){
                        $new_value = @$records_corr[$old_value];
                        if($new_value>0){
                            $query = 'UPDATE recDetails SET dtl_Value='.$new_value
                                    .' WHERE dtl_RecID='.$trg_recid.' AND dtl_DetailTypeID='.$fieldtype_id
                                    .' AND dtl_Value='.$old_value;
                                    
                        }else{
                            //target record not found 
                            $query = 'DELETE FROM recDetails '
                                    .' WHERE dtl_RecID='.$trg_recid.' AND dtl_DetailTypeID='.$fieldtype_id
                                    .' AND dtl_Value='.$old_value;
                        }
                        $ret = mysql__exec_param_query($mysqli, $query, null);
                        if($ret!==true){
                            self::$system->addError(HEURIST_DB_ERROR, 'Cannot update resource fields', $ret);
                            $is_rollback = true;
                            break;   
                        }
                    }
                }
            }//for
            
        }
        
        if($is_rollback){
                $mysqli->rollback();
                if($keep_autocommit===true) $mysqli->autocommit(TRUE);
                $res = false;
        }else{
                $mysqli->commit();
                if($keep_autocommit===true) $mysqli->autocommit(TRUE);
                $res = $cnt_imported;
                
        }
            
        if($session_id!=null){//finish
            mysql__update_progress($mysqli, $session_id, false, 'REMOVE');
        }
        
    }//$data

    return $res;
}

    
}  
?>