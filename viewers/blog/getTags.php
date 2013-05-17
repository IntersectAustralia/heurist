<?php

/*
* Copyright (C) 2005-2013 University of Sydney
*
* Licensed under the GNU License, Version 3.0 (the "License"); you may not use this file except
* in compliance with the License. You may obtain a copy of the License at
*
* http://www.gnu.org/licenses/gpl-3.0.txt
*
* Unless required by applicable law or agreed to in writing, software distributed under the License
* is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
* or implied. See the License for the specific language governing permissions and limitations under
* the License.
*/

/**
* This file retruns a json code array of array of tags keyed by record id
*  [rec_id1 => [ tag1,tag2...],
*   rec_id2 =>[..],
*   ...
*  ]
*
* @author      Tom Murtagh
* @author      Kim Jackson
* @author      Ian Johnson   <ian.johnson@sydney.edu.au>
* @author      Stephen White   <stephen.white@sydney.edu.au>
* @author      Artem Osmakov   <artem.osmakov@sydney.edu.au>
* @copyright   (C) 2005-2013 University of Sydney
* @link        http://Sydney.edu.au/Heurist
* @version     3.1.0
* @license     http://www.gnu.org/licenses/gpl-3.0.txt GNU License 3.0
* @package     Heurist academic knowledge management system
* @subpackage  !!!subpackagename for file such as Administration, Search, Edit, Application, Library
*/


require_once(dirname(__FILE__)."/../../common/php/dbMySqlWrappers.php");
require_once(dirname(__FILE__)."/../../common/connect/applyCredentials.php");

if (! is_logged_in()) return "";

$userID = intval($_REQUEST["u"]);

if (! $userID) return "";

mysql_connection_select(DATABASE);
// get a list of tags linked to any of the 'blog entry' records for this user
$res = mysql_query("select rec_ID, group_concat(tag_Text)
					  from Records, usrRecTagLinks, usrTags
					 where rec_RecTypeID = ".(defined('RT_BLOG_ENTRY')?RT_BLOG_ENTRY:0).
					 " and rtl_RecID = rec_ID
					   and tag_ID = rtl_TagID
					   and tag_UGrpID= " . $userID . "
					group by rec_ID");

$tags = array();
while ($row = mysql_fetch_array($res)) {
	$tags[$row[0]] = explode(",", $row[1]);
}

print json_format($tags);

?>
