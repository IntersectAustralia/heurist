<?php
	/**
	* File: processAction.php Import a record type, with all its Record Structure, Field types, and terms, or crosswalk it with an existing record type
	*
	* Juan Adriaanse 13 Apr 2011
	* @copyright 2005-2010 University of Sydney Digital Innovation Unit.
	* @link: http://HeuristScholar.org
	* @license http://www.gnu.org/licenses/gpl-3.0.txt
	* @package Heurist academic knowledge management system
	* @todo Show the import log once the importing is done, so user can see what happened, and change things where desired
	* @todo If an error occurres, delete everything that has been imported
	**/


require_once(dirname(__FILE__).'/../../common/connect/applyCredentials.php');
require_once(dirname(__FILE__).'/../../common/php/dbMySqlWrappers.php');

$targetDBName = @$_GET["importingTargetDBName"];
$tempDBName = @$_GET["tempDBName"];
$sourceDBName = @$_GET["sourceDBName"];
$importRtyID = @$_GET["importRtyID"];
$sourceDBID = @$_GET["sourceDBID"];
$currentDate = date("d-m");
$error = false;
$importLog = array();

mysql_connection_db_insert($targetDBName);
switch($_GET["action"]) {
	case "crosswalk":
		crosswalk();
		break;
	case "import":
		import();
		break;
	case "drop":
		dropDB();
		break;
	default:
		echo "Error: Unknown action received";
}

function crosswalk() {
/*	$res = mysql_query("insert into `defCrosswalk` (`crw_SourcedbID`, `crw_SourceCode`, `crw_DefType`, `crw_LocalCode`) values ('".$_GET["crwSourceDBID"]."','".$_GET["importRtyID"]."','rectype','".$_GET["crwLocalCode"]."')");
	if(!mysql_error()) {
		echo "Successfully crosswalked rectypes (IDs: " . $_GET["importRtyID"] . " and " . $_GET["crwLocalCode"] . ")";
	} else {
		echo "Error: " . mysql_error();
	}
*/}

function import() {
	global $error, $importLog, $tempDBName, $sourceDBName, $targetDBName, $sourceDBID, $importRtyID;
	$error = false;
	$importLog = array();
	if( !$tempDBName || $tempDBName === "" || !$targetDBName || $targetDBName === "" ||
		!$sourceDBID || !is_numeric($sourceDBID)|| !$importRtyID || !is_numeric($importRtyID)) {
		makeLogEntry("importParameters", -1, "One or more required import parameters not supplied or incorrect form ( ".
					"importingDBName={name of target DB} sourceDBID={reg number of source DB or 0} ".
					"importRtyID={numeric ID of rectype} tempDBName={temp db name where source DB type data are held}");
		$error = true;
	}

	if(!$error) {
		mysql_query("start transaction");
		$startedTransaction = true;
		// Get recordtype data that has to be imported
		$res = mysql_query("select * from ".$tempDBName.".defRecTypes where rty_ID = ".$importRtyID);
		if(mysql_num_rows($res) == 0) {
			$error = true;
			makeLogEntry("Record type", $importRtyID, " was not found in local, temporary copy of, source database ($sourceDBName)");
		} else {
			$importRty = mysql_fetch_assoc($res);
			/*****DEBUG****///error_log("Import entity is  ".print_r($importRty,true));
		}
		// check if rectype already imported, if so return the local id.
		if(!$error && $importRty) {
			$origRtyName = $importRty["rty_Name"];
			$replacementName = @$_GET["replaceRecTypeName"];
			if($replacementName && $replacementName != "") {
				$importRty["rty_Name"] = $replacementName;
				$importRty["rty_Plural"] = ""; //TODO  need better way of determining the plural
			}
			if($importRty["rty_OriginatingDBID"] == 0 || $importRty["rty_OriginatingDBID"] == "") {
				$importRty["rty_OriginatingDBID"] = $sourceDBID;
				$importRty["rty_IDInOriginatingDB"] = $importRtyID;
				$importRty["rty_NameInOriginatingDB"] = $origRtyName;
			}
			//lookup rty in target DB
			$resRtyExist = mysql_query("select rty_ID from ".$targetDBName.".defRecTypes ".
							"where rty_OriginatingDBID = ".$importRty["rty_OriginatingDBID"].
							" AND rty_IDInOriginatingDB = ".$importRty["rty_IDInOriginatingDB"]);
			// Rectype is not in target DB so import it
			if(mysql_num_rows($resRtyExist) > 0 ) {
				$localRtyID = mysql_fetch_array($resRtyExist,MYSQL_NUM);
				$localRtyID = $localRtyID[0];
				makeLogEntry("Record type", $importRtyID, " exists in $targetDBName as ID = $localRtyID");
			}else{
			$localRtyID = importRectype($importRty);
			}
		}
	}
	// successful import
	if(!$error) {
		if ($startedTransaction) mysql_query("commit");
		$statusMsg = "";
		if(sizeof($importLog) > 0) {
			foreach($importLog as $logLine) {
				echo  $logLine[0].": import ID = ".$logLine[1]." ".$logLine[2] . "<br />";
			}
		}
		echo "Successfully imported record type '".$importRty["rty_Name"]."' from ".$sourceDBName."<br />";
		echo "<br />";
		return $localRtyID;
	// duplicate record found
	} else if (substr(mysql_error(), 0, 9) == "Duplicate") {
		if ($startedTransaction) mysql_query("rollback");
		echo "prompt";
	//general error condition
	} else {
		if ($startedTransaction) mysql_query("rollback");
		if (mysql_error()) {
			$statusMsg = "MySQL error: " . mysql_error() . "<br />";
		} else  {
			$statusMsg = "Error:<br />";
		}
		if(sizeof($importLog) > 0) {
			foreach($importLog as $logLine) {
				if($logLine[1] == -1) {
					$statusMsg .= $logLine[0].": ".$logLine[2] . "<br />";
				}else{
					$statusMsg .= $logLine[0].": import ID = ".$logLine[1]." ".$logLine[2] . "<br />";
				}
			}
			$statusMsg .= "Changes rolled back, nothing was imported";
		}
		// TODO: Delete all information that has already been imported (retrieve from $importLog)
		echo $statusMsg;
	}
}

function importDetailType($importDty) {
	global $error, $importLog, $tempDBName, $targetDBName, $sourceDBID;
	static $importDtyGroupID;
	$importDtyID = $importDty["dty_ID"];
/*****DEBUG****///error_log(" in import dty $importDtyID");
	if (!$importDtyGroupID) {
		// Create new group with todays date, which all detailtypes that the recordtype uses will be added to
		$dtyGroup = mysql_query("select dtg_ID from ".$targetDBName.".defDetailTypeGroups where dtg_Name = 'Imported'");
		if(mysql_num_rows($dtyGroup) == 0) {
			mysql_query("INSERT INTO ".$targetDBName.".defDetailTypeGroups ".
						"(dtg_Name,dtg_Order, dtg_Description) ".
						"VALUES ('Imported', '999',".
								" 'This group contains all detailtypes that were imported from external databases')");
			// Write the insert action to $logEntry, and set $error to true if one occurred
			if(mysql_error()) {
				$error = true;
				makeLogEntry("Field type group", -1, "Unable to find field type group 'Import' - ".mysql_error());
			} else {
				$importDtyGroupID = mysql_insert_id();
				makeLogEntry("Field type group", -1, "Provisional entry 'Import' as ID = $importDtyGroupID");
			}
		} else {
			$row = mysql_fetch_row($dtyGroup);
			$importDtyGroupID = $row[0];
			makeLogEntry("Field type group", -1, "Group 'Import' exists in $targetDBName as ID = $importDtyGroupID");
		}
	}
/*****DEBUG****///error_log("import dty $importDtyID 1".($error?"error":""));

	if(!$error && @$importDty['dty_JsonTermIDTree'] && $importDty['dty_JsonTermIDTree'] != '') {
		// term tree exist so need to translate to new ids
		$importDty['dty_JsonTermIDTree'] =  translateTermIDs($importDty['dty_JsonTermIDTree'],"term tree"," detailType '".$importDty["dty_Name"]."' ID = $importDtyID");
	}
/*****DEBUG****///error_log("import dty $importDtyID 2".($error?"error":""));

	if(!$error && @$importDty['dty_TermIDTreeNonSelectableIDs'] && $importDty['dty_TermIDTreeNonSelectableIDs'] != '') {
		// term non selectable list exist so need to translate to new ids
		$importDty['dty_TermIDTreeNonSelectableIDs'] =  translateTermIDs($importDty['dty_TermIDTreeNonSelectableIDs'],"non-selectable"," detailType '".$importDty["dty_Name"]."' ID = $importDtyID");
	}
/*****DEBUG****///error_log("import dty $importDtyID 3".($error?"error":""));

	if(!$error && @$importDty['dty_PtrTargetRectypeIDs'] && $importDty['dty_PtrTargetRectypeIDs'] != '') {
		// Target Rectype list exist so need to translate to new ids
		$importDty['dty_PtrTargetRectypeIDs'] =  translateRtyIDs($importDty['dty_PtrTargetRectypeIDs'],'pointers',$importDty["dty_ID"]);
	}
/*****DEBUG****///error_log("import dty $importDtyID 4".($error?"error":""));

	if(!$error && @$importDty['dty_FieldSetRectypeID'] && $importDty['dty_FieldSetRectypeID'] != '') {
		// dty represents a base rectype so need to translate to local id
		$importDty['dty_FieldSetRectypeID'] =  translateRtyIDs("".$importDty['dty_FieldSetRectypeID'],'fieldsets',$importDty["dty_ID"]);
	}
/*****DEBUG****///error_log("import dty $importDtyID 5".($error?"error":""));


	if (!$error) {
		// Check wether the name is already in use. If so, add a number as suffix and find a name that is unused
		$detailTypeSuffix = 2;
		while(mysql_num_rows(mysql_query("select * from ".$targetDBName.".defDetailTypes where dty_Name = '".$importDty["dty_Name"]."'")) != 0) {
			$importDty["dty_Name"] = $importDty["dty_Name"] . $detailTypeSuffix;
			makeLogEntry("Field type", $importDtyID, "Field name used in source DB already exists in target DB, but with different concept ID. Added suffix: ".$detailTypeSuffix);
			$detailTypeSuffix++;
		}

		// Change some detailtype fields to make it suitable for the new DB, and insert
		unset($importDty["dty_ID"]);
		$importDty["dty_DetailTypeGroupID"] = $importDtyGroupID;
		$importDty["dty_Name"] = mysql_real_escape_string($importDty["dty_Name"]);
		$importDty["dty_Documentation"] = mysql_real_escape_string($importDty["dty_Documentation"]);
		$importDty["dty_HelpText"] = mysql_real_escape_string($importDty["dty_HelpText"]);
		$importDty["dty_ExtendedDescription"] = mysql_real_escape_string($importDty["dty_ExtendedDescription"]);
		$importDty["dty_NameInOriginatingDB"] = mysql_real_escape_string($importDty["dty_NameInOriginatingDB"]);
		mysql_query("INSERT INTO ".$targetDBName.".defDetailTypes (".implode(", ",array_keys($importDty)).") VALUES ('".implode("', '",array_values($importDty))."')");
		// Write the insert action to $logEntry, and set $error to true if one occurred
		if(mysql_error()) {
			$error = true;
			makeLogEntry("Field type", $importDtyID, "MySQL error importing field type - ".mysql_error());
			break;
		} else {
			$importedDtyID = mysql_insert_id();
			makeLogEntry("Field type", $importDtyID, "provisional entry '".$importDty["dty_Name"]."' as ID = $importedDtyID");
			return $importedDtyID;
		}
	}
}

// function that translates all rectype ids in the passed string to there local/imported value
function translateRtyIDs($strRtyIDs, $contextString, $forDtyID) {
	global $error, $importLog, $tempDBName, $sourceDBName, $targetDBName, $sourceDBID;
	if (!$strRtyIDs) {
		return "";
	}
/*****DEBUG****///error_log("translate rtyIDs $strRtyIDs");
	$outputRtyIDs = array();
	$rtyIDs = explode(",",$strRtyIDs);
	foreach($rtyIDs as $importRtyID) {
	// Get recordtype data that has to be imported
		$res = mysql_query("select * from ".$tempDBName.".defRecTypes where rty_ID = ".$importRtyID);
		if(mysql_num_rows($res) == 0) {
			$error = true;
			makeLogEntry("Record type", $importRtyID, " record type referenced by $contextString in field type '$forDtyID' was not found in local, temporary copy of, source database ($sourceDBName)");
			return null; // missing rectype in importing DB
		} else {
			$importRty = mysql_fetch_assoc($res);
/*****DEBUG****///error_log("tran srcRTY  =  ".print_r($importRty,true));
		}

		// check if rectype already imported, if so return the local id.
		if(!$error && $importRty) {
			// change to global ID for lookup
			if(!$importRty["rty_OriginatingDBID"] || $importRty["rty_OriginatingDBID"] == 0 || $importRty["rty_OriginatingDBID"] == "") {
					$importRty["rty_OriginatingDBID"] = $sourceDBID;
					$importRty["rty_IDInOriginatingDB"] = $importRtyID;
					$importRty["rty_NameInOriginatingDB"] = $importRty["rty_Name"];
			}
			//lookup rty in target DB
			$resRtyExist = mysql_query("select rty_ID from ".$targetDBName.".defRecTypes ".
							"where rty_OriginatingDBID = ".$importRty["rty_OriginatingDBID"].
							" AND rty_IDInOriginatingDB = ".$importRty["rty_IDInOriginatingDB"]);
							// Detailtype is not in target DB so import it
			if(mysql_num_rows($resRtyExist) == 0 ) {
/*****DEBUG****///error_log("translateRtyIDS import rtyID - ".$importRty['rty_ID']);
				$localRtyID = importRectype($importRty);
				$msg = " provisional entry record type as ID = $localRtyID";
			} else {
				$row = mysql_fetch_row($resRtyExist);
				$localRtyID = $row[0];
				$msg = " found matching rectype entry in $targetDBName rectype ID = ".$localRtyID;
			}
/*****DEBUG****///error_log($msgCat." $importRtyID to local ID $localRtyID ");
			if (!$error){
				makeLogEntry("Record type",$importRtyID, "while translating record type for $contextString in field type '$forDtyID'".$msg);
				array_push($outputRtyIDs, $localRtyID); // store the local ID in output array
			}
		}
		if ($error) {
			break;
		}
	}
	return implode(",", $outputRtyIDs); // return comma separated list of local RtyIDs
}

function importRectype($importRty) {
	global $error, $importLog, $tempDBName, $sourceDBName, $targetDBName, $sourceDBID;
	static $importRtyGroupID;
	$importRtyID = $importRty['rty_ID'];
/*****DEBUG****///error_log("import rtyID $importRtyID to  $targetDBName DB");

	// Get Imported  rectypeGroupID
	if(!$error && !$importRtyGroupID) {
		// Finded 'Imported' rectype group or create it if it doesn't exist
		$rtyGroup = mysql_query("select rtg_ID from ".$targetDBName.".defRecTypeGroups where rtg_Name = 'Imported'");
/*****DEBUG****///error_log("import rty 1");
		if(mysql_num_rows($rtyGroup) == 0) {
			mysql_query("INSERT INTO ".$targetDBName.".defRecTypeGroups ".
						"(rtg_Name,rtg_Domain,rtg_Order, rtg_Description) ".
						"VALUES ('Imported','functionalgroup' , '999',".
								" 'This group contains all record types that were imported from external databases')");
		// Write the insert action to $logEntry, and set $error to true if one occurred
/*****DEBUG****///error_log("import rty 2");
			if(mysql_error()) {
				$error = true;
				makeLogEntry("Record type group", -1, "Could not find record type group 'Import' - ".mysql_error());
			} else {
				$importRtyGroupID = mysql_insert_id();
				makeLogEntry("Record type group", -1, "provisional record type group 'Import' as ID = $importRtyGroupID");
			}
		} else {
/*****DEBUG****///error_log("import rty 3");
			$row = mysql_fetch_row($rtyGroup);
			$importRtyGroupID = $row[0];
			makeLogEntry("Record type group", -1, "Record type group 'Import' exists in $targetDBName as ID = $importRtyGroupID");
		}
	}
/*****DEBUG****///error_log("import rty 3a");

	if(!$error) {
/*****DEBUG****///error_log("import rty 3aa");
		// get rectype Fields and check they are not already imported
		$recStructuresByDtyID = array();
		// get the rectypes structure
		$resRecStruct = mysql_query("select * from ".$tempDBName.".defRecStructure where rst_RecTypeID = ".$importRtyID);
		while($rtsFieldDef = mysql_fetch_assoc($resRecStruct)) {
			$importFieldDtyID = $rtsFieldDef['rst_DetailTypeID'];
			$recStructuresByDtyID[$importFieldDtyID] = $rtsFieldDef;

			// If this recstructure field has originating DBID 0 it's an original concept
			// need to set the origin DBID to the DB it is being imported from
			if($rtsFieldDef["rst_OriginatingDBID"] == 0 || $rtsFieldDef["rst_OriginatingDBID"] == "") {
				$rtsFieldDef["rst_OriginatingDBID"] = $sourceDBID;

				$rtsFieldDef["rst_IDInOriginatingDB"] = $rtsFieldDef["rst_ID"];
			}
			// check that field doesn't already exist
			$resRstExist = mysql_query("select rst_ID from ".$targetDBName.".defRecStructure ".
							"where rst_OriginatingDBID = ".$rtsFieldDef["rst_OriginatingDBID"].
							" AND rst_IDInOriginatingDB = ".$rtsFieldDef["rst_IDInOriginatingDB"]);
			if ( mysql_num_rows($resRstExist)) {
				makeLogEntry("Record structure", $rtsFieldDef["rst_ID"], "Error: found existing field structure while importing field \"".$rtsFieldDef["rst_DisplayName"]."\" defDetailType ID = $importFieldDtyID rectype ID = $importRtyID");
				makeLogEntry("Record structure", $rtsFieldDef["rst_ID"], "Originating DBID = ".$rtsFieldDef["rst_OriginatingDBID"]." Field ID = ".$rtsFieldDef["rst_IDInOriginatingDB"]);
//				$error = true;
			}
		}

/*****DEBUG****///error_log("import rty 3b");

		if(!$error) {	//import rectype
/*****DEBUG****///error_log("import rty 3bb");
			$recTypeSuffix = 2;
			while(mysql_num_rows(mysql_query("select * from ".$targetDBName.".defRecTypes where rty_Name = '".$importRty["rty_Name"]."'")) != 0) {
				$importRty["rty_Name"] = $importRty["rty_Name"] . $recTypeSuffix;
				makeLogEntry("Record type",$importRtyID, "Record type name used in the source DB already exist in the target DB($targetDBName) but with different concept code. Added suffix: ".$recTypeSuffix);
				$recTypeSuffix++;
			}

			// Change some recordtype fields to make it suitable for the new DB
			unset($importRty["rty_ID"]);
			$importRty["rty_RecTypeGroupID"] = $importRtyGroupID;
			$importRty["rty_Name"] = mysql_escape_string($importRty["rty_Name"]);
			$importRty["rty_Description"] = mysql_escape_string($importRty["rty_Description"]);
			$importRty["rty_Plural"] = mysql_escape_string($importRty["rty_Plural"]);
			$importRty["rty_NameInOriginatingDB"] = mysql_escape_string($importRty["rty_NameInOriginatingDB"]);
			$importRty["rty_ReferenceURL"] = mysql_escape_string($importRty["rty_ReferenceURL"]);
			$importRty["rty_AlternativeRecEditor"] = mysql_escape_string($importRty["rty_AlternativeRecEditor"]);

			// Insert recordtype
			mysql_query("INSERT INTO ".$targetDBName.".defRecTypes ".
						"(".implode(", ",array_keys($importRty)).") VALUES ".
						"('".implode("', '",array_values($importRty))."')");
			// Write the insert action to $logEntry, and set $error to true if one occurred
			if(mysql_error()) {
				$error = true;
/*****DEBUG****///error_log("import rty $importRtyID 3bbb  ". mysql_error());
				makeLogEntry("Record type", $importRtyID, "MySQL error importing record type - ".mysql_error());
			} else {
				$importedRecTypeID = mysql_insert_id();
				makeLogEntry("Record type", $importRtyID, " provisional entry '".$importRty["rty_Name"]."' with ID = $importedRecTypeID");
			}
		}

		if(!$error) {
			// Import the structure for the recordtype imported
			foreach ( $recStructuresByDtyID as $dtyID => $rtsFieldDef) {
				// get import detailType for this field
				 $resDTY= mysql_query("select * from ".$tempDBName.".defDetailTypes where dty_ID = $dtyID");
				if(mysql_num_rows($resDTY) == 0) {
					$error = true;
/*****DEBUG****///error_log("import rty $importRtyID 3cc  dtyID = $dtyID not in source db ");
					makeLogEntry("Field type", $dtyID, "Bad source: Field type $dtyID for field '".$rtsFieldDef['rst_DisplayName']."' in record type (".$rtsFieldDef['rst_RecTypeID'].") not found in the source db. Please contact owner of $sourceDBName");
					return null; // missing detatiltype in importing DB
				} else {
					$importDty = mysql_fetch_assoc($resDTY);
					/*****DEBUG****///error_log("Import dty is  ".print_r($importDty,true));
				}

				// If detailtype has originating DBID 0, set it to the DBID from the DB it is being imported from
				if(!$importDty["dty_OriginatingDBID"] || $importDty["dty_OriginatingDBID"] == 0 || $importDty["dty_OriginatingDBID"] == "") {
					$importDty["dty_OriginatingDBID"] = $sourceDBID;
					$importDty["dty_IDInOriginatingDB"] = $importDty['dty_ID'];
					$importDty["dty_NameInOriginatingDB"] = $importDty['dty_Name'];
				}

				// Check to see if the detailType for this field exist in the target DB
				$resExistingDty = mysql_query("select dty_ID from ".$targetDBName.".defDetailTypes ".
										"where dty_OriginatingDBID = ".$importDty["dty_OriginatingDBID"].
										" AND dty_IDInOriginatingDB = ".$importDty["dty_IDInOriginatingDB"]);

				// Detailtype is not in target DB so import it
				if(mysql_num_rows($resExistingDty) == 0) {
/*****DEBUG****///error_log("import rty $importRtyID 4a  dtyID = ".$importDty['dty_ID']);
					$rtsFieldDef["rst_DetailTypeID"] = importDetailType($importDty);
/*****DEBUG****///error_log("import rty $importRtyID 4b  dtyID = ".$importDty['dty_ID']."->".$rtsFieldDef["rst_DetailTypeID"]);
				} else {
					$existingDtyID = mysql_fetch_array($resExistingDty);
					$rtsFieldDef["rst_DetailTypeID"] = $existingDtyID[0];
/*****DEBUG****///error_log("import rty $importRtyID 5  dtyID = ".$importDty['dty_ID']."=".$rtsFieldDef["rst_DetailTypeID"]);
				}

				if(!$error && @$rtsFieldDef['rst_FilteredJsonTermIDTree'] && $rtsFieldDef['rst_FilteredJsonTermIDTree'] != '') {
/*****DEBUG****///error_log("import rty $importRtyID 6  dtyID = ".$importDty['dty_ID']."->".$rtsFieldDef["rst_DetailTypeID"]." (".$rtsFieldDef['rst_FilteredJsonTermIDTree'].")");
					// term tree exist so need to translate to new ids
					$rtsFieldDef['rst_FilteredJsonTermIDTree'] =  translateTermIDs($rtsFieldDef['rst_FilteredJsonTermIDTree'],"filtered term tree"," field '".$rtsFieldDef['rst_DisplayName']."' detailTypeID = $dtyID in rectype '".$importRty["rty_Name"]."'");
				}

				if(!$error && @$rtsFieldDef['rst_TermIDTreeNonSelectableIDs'] && $rtsFieldDef['rst_TermIDTreeNonSelectableIDs'] != '') {
/*****DEBUG****///error_log("import rty $importRtyID 7  dtyID = ".$importDty['dty_ID']."->".$rtsFieldDef["rst_DetailTypeID"]);
					// term non selectable list exist so need to translate to new ids
/*****DEBUG****///error_log("non selectable = ". print_r($rtsFieldDef['rst_TermIDTreeNonSelectableIDs'],true));
					$rtsFieldDef['rst_TermIDTreeNonSelectableIDs'] = translateTermIDs($rtsFieldDef['rst_TermIDTreeNonSelectableIDs'],"non-selectable"," field '".$rtsFieldDef['rst_DisplayName']."' detailTypeID = $dtyID in rectype '".$importRty["rty_Name"]."'");
				}

				if(!$error && @$rtsFieldDef['rst_PtrFilteredIDs'] && $rtsFieldDef['rst_PtrFilteredIDs'] != '') {
/*****DEBUG****///error_log("import rty $importRtyID 8  dtyID = ".$importDty['dty_ID']."->".$rtsFieldDef["rst_DetailTypeID"]);
					// Target Rectype list exist so need to translate to new ids
					$rtsFieldDef['rst_PtrFilteredIDs'] =  translateRtyIDs($rtsFieldDef['rst_PtrFilteredIDs'],'filtered pointers',$importDty["dty_ID"]);
				}
/*****DEBUG****///error_log("import rty $importRtyID 9  dtyID = ".$importDty['dty_ID']."->".$rtsFieldDef["rst_DetailTypeID"]);

				if(!$error) {
/*****DEBUG****///error_log("import rty $importRtyID 10  dtyID = ".$importDty['dty_ID']."->".$rtsFieldDef["rst_DetailTypeID"]);
					// Adjust values of the field structure for the imported recordtype
					$importRstID = $rtsFieldDef["rst_ID"];
					unset($rtsFieldDef["rst_ID"]);
					$rtsFieldDef["rst_RecTypeID"] = $importedRecTypeID;
					$rtsFieldDef["rst_DisplayName"] = mysql_escape_string($rtsFieldDef["rst_DisplayName"]);
					$rtsFieldDef["rst_DisplayHelpText"] = mysql_escape_string($rtsFieldDef["rst_DisplayHelpText"]);
					$rtsFieldDef["rst_DisplayExtendedDescription"] = mysql_escape_string($rtsFieldDef["rst_DisplayExtendedDescription"]);
					$rtsFieldDef["rst_DefaultValue"] = mysql_escape_string($rtsFieldDef["rst_DefaultValue"]);
					$rtsFieldDef["rst_DisplayHelpText"] = mysql_escape_string($rtsFieldDef["rst_DisplayHelpText"]);
					// Import the field structure for the imported recordtype
					mysql_query("INSERT INTO ".$targetDBName.".defRecStructure (".implode(", ",array_keys($rtsFieldDef)).") VALUES ('".implode("', '",array_values($rtsFieldDef))."')");
					// Write the insert action to $logEntry, and set $error to true if one occurred
					if(mysql_error()) {
						$error = true;
						makeLogEntry("Record structure ", $importRstID, "Error importing field '".$rtsFieldDef["rst_DisplayName"]."' for record type '".$importRty["rty_Name"]."' - ".mysql_error());
						break;
					} else {
						makeLogEntry("Record structure", mysql_insert_id(), "provisional entry '".$rtsFieldDef["rst_DisplayName"]."' for record type '".$importRty["rty_Name"]."'");
					}
				}
				if ($error) {
					break;
				}
			}
			if (!$error) {
				return $importedRecTypeID;
			}
		}
		return null;
	}
}


// function that translates all term ids in the passed string to there local/imported value
function translateTermIDs($formattedStringOfTermIDs, $contextString, $forEntryString) {
	global $error, $importLog, $tempDBName, $targetDBName, $sourceDBID;
	if (!$formattedStringOfTermIDs || $formattedStringOfTermIDs == "") {
		return "";
	}
	makeLogEntry("Term Translation", -1, "Translating $contextString terms $formattedStringOfTermIDs for $forEntryString");
	$retJSonTermIDs = $formattedStringOfTermIDs;
	if (strpos($retJSonTermIDs,"{")!== false) {
/*****DEBUG****///error_log( "term tree string = ". $formattedStringOfTermIDs);
		$temp = preg_replace("/[\{\}\",]/","",$formattedStringOfTermIDs);
		if (strrpos($temp,":") == strlen($temp)-1) {
			$temp = substr($temp,0, strlen($temp)-1);
		}
		$termIDs = explode(":",$temp);
	} else {
/*****DEBUG****///error_log( "term array string = ". $formattedStringOfTermIDs);
		$temp = preg_replace("/[\[\]\"]/","",$formattedStringOfTermIDs);
		$termIDs = explode(",",$temp);
	}

	// Import terms
	foreach ($termIDs as $importTermID) {
		// importTerm
		$translatedTermID = importTermID($importTermID);
		// check that the term imported correctly
		if ($translatedTermID == ""){
			return "";
		}
		//replace termID in string
		$retJSonTermIDs = preg_replace("/\"".$importTermID."\"/","\"".$translatedTermID."\"",$retJSonTermIDs);
	}
	// TODO: update the ChildCounts
	makeLogEntry("Term string", '', "Translated $formattedStringOfTermIDs to $retJSonTermIDs.");

	return $retJSonTermIDs;
}

function importTermID($importTermID) {
	global $error, $importLog, $tempDBName, $targetDBName, $sourceDBID;
/*****DEBUG****///error_log( "import termID = ". $importTermID);
	if (!$importTermID){
		return "";
	}
	//the source term we want to import
	$term = mysql_fetch_assoc(mysql_query("select * from ".$tempDBName.".defTerms where trm_ID = ".$importTermID));
	if(!$term || @$term['trm_ID'] != $importTermID) {
		// log the problem and return an empty string
		$error = true;
		makeLogEntry("Term", $importTermID, "Term ID = $importTermID doesn't exist in source database");
		if(mysql_error()) {
			makeLogEntry("Term", $importTermID, "SQL error importing term - ".mysql_error());
		}
		return "";
	} else {
		// If term has originating DBID 0, set it to the DBID from the DB it is being imported from
		if($term["trm_OriginatingDBID"] == 0 || $term["trm_OriginatingDBID"] == "") {
			$term["trm_OriginatingDBID"] = $sourceDBID;
			$term["trm_IDInOriginatingDB"] = $importTermID;
		}
		// Check wether this term is already imported
		$resExistingTrm = mysql_query("select trm_ID from ".$targetDBName.".defTerms ".
								"where trm_OriginatingDBID = ".$term["trm_OriginatingDBID"].
								" AND trm_IDInOriginatingDB = ".$term["trm_IDInOriginatingDB"]);
		// Term is in target DB so return translated term ID
		if(mysql_num_rows($resExistingTrm) > 0) {
			$existingTermID = mysql_fetch_array($resExistingTrm);
/*****DEBUG****///error_log( " existing term  = ". print_r($existingTermID,true));
			return $existingTermID[0];
		} else {
			// If parent term exist import  it first and use the save the parentID
			$sourceParentTermID = $term["trm_ParentTermID"];
			if (($sourceParentTermID != "") && ($sourceParentTermID != 0)) {
				$localParentTermID = importTermID($sourceParentTermID);
				// TODO: check that the term imported correctly
				if (($localParentTermID == "") || ($localParentTermID == 0)) {
					makeLogEntry("Term", $sourceParentTermID, "Error importing parent term for term ID =$importTermID .");
					return "";
				}else{
					$term["trm_ParentTermID"] = $localParentTermID;
					makeLogEntry("Term", $sourceParentTermID, "provisional parent term with term ID = $localParentTermID");
				}
			} else {
				unset($term["trm_ParentTermID"]);
			}
			$selfInverse = false;
			if($term["trm_InverseTermId"] == $term["trm_ID"]) {
				$selfInverse = true;
			}
			$inverseSourceTrmID = $term["trm_InverseTermId"];

			// Import the term
			unset($term["trm_ID"]);
			unset($term["trm_ChildCount"]);
			unset($term["trm_InverseTermId"]);
			$term["trm_AddedByImport"] = 1;
			$term["trm_Label"] = mysql_escape_string($term["trm_Label"]);
			$term["trm_Description"] = mysql_escape_string($term["trm_Description"]);
			$term["trm_NameInOriginatingDB"] = mysql_escape_string($term["trm_NameInOriginatingDB"]);
			mysql_query("INSERT INTO ".$targetDBName.".defTerms (".implode(", ",array_keys($term)).") ".
													"VALUES ('".implode("', '",array_values($term))."')");
			// Write the insert action to $logEntry, and set $error to true if one occurred
			if(mysql_error()) {
				$error = true;
				makeLogEntry("Term", $importTermID, "MySQL error importing term -".mysql_error());
				return "";
			} else {
				$newTermID = mysql_insert_id();
				makeLogEntry("Term", $importTermID, "provisional term ID = $newTermID");
			}

			//handle inverseTerm if there is one
			if( $inverseSourceTrmID && $inverseSourceTrmID != "") {
				if($selfInverse) {
					$localInverseTermID = $newTermID;
				} else {
					$localInverseTermID = importTermID($inverseSourceTrmID);
				}
			// If there is an inverse term then update this term with it's local ID
				mysql_query("UPDATE ".$targetDBName.".defTerms SET trm_InverseTermId=".$localInverseTermID." where trm_ID=".$newTermID);
			}
			return $newTermID;
		}
	}
}

function makeLogEntry( $name = "unknown", $id = "", $msg = "no message" ) {
	global $importLog;
	array_push($importLog, array($name, $id, $msg));
}

// Checks whether passed $tempDBName contains 'temp_', and if so, deletes the database
function dropDB() {
	$tempDBName = $_GET["tempDBName"];
	$isTempDB = strpos($tempDBName, "temp_");
	if($isTempDB !== false) {
		mysql_query("drop database ".$tempDBName);
		if(!mysql_error()) {
			echo "Temporary database was sucessfully deleted";
			return true;
		} else {
			echo "Error: Something went wrong deleting the temporary database";
			return false;
		}
	} else {
		echo "Error: cannot delete a non-temporary database";
		return false;
	}
}
?>

