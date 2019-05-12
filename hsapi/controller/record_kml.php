<?php

    /**
    * Returns content of kml snippet field as kml output
    * 
    * @package     Heurist academic knowledge management system
    * @link        http://HeuristNetwork.org
    * @copyright   (C) 2005-2019 University of Sydney
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

    require_once (dirname(__FILE__).'/../System.php');
    require_once (dirname(__FILE__).'/../dbaccess/db_recsearch.php');
    require_once (dirname(__FILE__).'/../dbaccess/utils_db.php');
    
    require_once (dirname(__FILE__).'/../../vendor/autoload.php'); //for geoPHP
    require_once(dirname(__FILE__).'/../../viewers/map/Simplify.php');
    
    $response = array();

    $system = new System();
    
    $params = $_REQUEST;
    
    if( ! $system->init(@$params['db']) ){
        //get error and response
        $system->error_exit_api(); //exit from script
    }
    if(!(@$params['recID']>0)){
        $system->error_exit_api('recID parameter is not defined or has wrong value'); //exit from script
    }
    if(!$system->defineConstant('DT_KML')){
        $system->error_exit_api('Database '.$params['db'].' does not have field definitionr for KML snipppet'); //exit from script
    }
    
    $record = array("rec_ID"=>$params['recID']);
    recordSearchDetails($system, $record, array(DT_KML));
    if (@$record["details"] && @$record["details"][DT_KML]){
    
            $kml = array_shift($record["details"][DT_KML]);     
        
            if(@$params['format']=='geojson'){

                //@todo use importParser to proper kml parsing and extraction features                
                
                $geom = geoPHP::load($kml, 'kml');
                if(!$geom->isEmpty()){
                    
                    
                        $geojson_adapter = new GeoJSON(); 
                        $json = $geojson_adapter->write($geom, true); 
                        
                        if(count($json['coordinates'])>0){
                            
                            if(@$params['simplify']){
                                
                                if($json['type']=='LineString'){

                                    simplifyCoordinates($json['coordinates']);

                                } else if($json['type']=='Polygon'){
                                    for($idx=0; $idx<count($json['coordinates']); $idx++){
                                        simplifyCoordinates($json['coordinates'][$idx]);
                                    }
                                } else if ( $json['type']=='MultiPolygon' || $json['type']=='MultiLineString')
                                {
                                    for($idx=0; $idx<count($json['coordinates']); $idx++) //shapes
                                        for($idx2=0; $idx2<count($json['coordinates'][$idx]); $idx2++) //points
                                            simplifyCoordinates($json['coordinates'][$idx][$idx2]);
                                }
                            }
                            
                            $json = array(array(
                                'type'=>'Feature',
                                'geometry'=>$json,
                                'properties'=>array()
                            ));
                        }
                        
                        $json = json_encode($json);
                        header('Content-Type: application/json');
                        //header('Content-Type: application/vnd.geo+json');
                        //header('Content-disposition: attachment; filename=output.json');
                        header('Content-Length: ' . strlen($json));
                        exit($json);
                }
                
            }else{
                
                header('Content-Type: application/vnd.google-earth.kml+xml');
                header('Content-disposition: attachment; filename=output.kml');
                header('Content-Length: ' . strlen($kml));
                exit($kml);
            }
    }else{
            exit(); //nothingh found
    }
?>