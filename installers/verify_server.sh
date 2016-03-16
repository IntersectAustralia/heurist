#! /bin/sh

# verify_server.sh: Verifies packages etc. on Ubuntu/Debian server

# Note: This file is referenced in the installation instructions on HeuristNetwork.org
#       do not move, rename or delete

# Note: this file retrieved from old distribution on 16 sep 2015, may need updating

# @package     Heurist academic knowledge management system
# @link        http://HeuristNetwork.org
# @copyright   (C) 2005-2016 University of Sydney
# @author      Ian Johnson     <ian.johnson@sydney.edu.au>
# @author      Brian Ballsun-Stanton <brian@fedarch.org>
# @license     http://www.gnu.org/licenses/gpl-3.0.txt GNU License 3.0
# @version     3.4

# Licensed under the GNU License, Version 3.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at http://www.gnu.org/licenses/gpl-3.0.txt
# Unless required by applicable law or agreed to in writing, software distributed under the License is
# distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied
# See the License for the specific language governing permissions and limitations under the License.

echo
echo "----------------------- Checking server for installed packages Ubuntu/Debian ---------------------------"
echo
echo

# ******** REQUIRED ************ 
                               
echo "checking for: curl"
if ! dpkg -s curl > /dev/null; then
        echo "curl not found."
fi

echo "checking for: php5"
if ! dpkg -s php5 > /dev/null; then
        echo "php5 not found."
fi

echo "checking for: php5-curl"
if ! dpkg -s php5-curl > /dev/null; then
        echo "php5-curl not found."
fi


echo "checking for: mysql-server"
if ! dpkg -s mysql-server > /dev/null; then
        echo "mysql-server not found."
fi

echo "checking for: php5-xsl"
if ! dpkg -s php5-xsl > /dev/null; then
        echo "php5-xsl not found."
fi

echo "checking for:  php5-mysql"
if ! dpkg -s  php5-mysql > /dev/null; then
        echo " php5-mysql not found."
fi

echo "checking for: memcache"
if ! dpkg -s php5-memcache > /dev/null; then
        echo "php5-memcache not found."
fi

echo "checking for: php5-memcached"
if ! dpkg -s php5-memcached > /dev/null; then
        echo "php5-memcached not found."
fi

#echo "checking for: SPL"
#if ! dpkg -s SPL > /dev/null; then
#        echo "SPL not found."
#fi

#echo "checking for: filter"
#if ! dpkg -s filter > /dev/null; then
#        echo "filter not found."
#fi

#echo "checking for: pcre"
#if ! dpkg -s pcre > /dev/null; then
#        echo "pcre not found."
#fi


#echo "checking for: simpleXML"
#if ! dpkg -s simpleXML > /dev/null; then
#        echo "simpleXML not found."
#fi

echo "checking for: php5-gd"
if ! dpkg -s php5-gd > /dev/null; then
        echo "php5-gd not found."
fi

echo "checking for: zip"
if ! dpkg -s zip > /dev/null; then
        echo "zip not found."
fi

# ******** OPTIONAL ************ 

echo "checking for: php5-gd"
if ! dpkg -s php5-gd > /dev/null; then
        echo "php5-gd not found."
fi

echo "checking for: zip"
if ! dpkg -s zip > /dev/null; then
        echo "zip not found."
fi

#echo "checking for: exif"
#if ! dpkg -s exif > /dev/null; then
#        echo "exif not found  (only req. for file indexing)."
#fi
#

echo "checking for: postfix"
if ! dpkg -s php5-sqlite > /dev/null; then
        echo "php5-sqlite not found."
fi


echo 
echo "Checks completed. Errors, if any, are reported above."

echo


