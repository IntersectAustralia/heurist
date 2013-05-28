{$notrec = 0}
{foreach $results as $r}

{$recognized = true}

{if ($r.recTypeName=="Internet bookmark")}
<div>
   {$r.date} {$r.title_name} [Web site]<br/>
   {$r.short_summary}
</div>
{elseif $r.recTypeName=="Book"}

<div>
{$editors = $r.Author_Editor_s_s}
{$cnt = count($editors )}
{foreach $editors as $auth}
{if $cnt gt 1}{if $cnt==$auth.recOrder+1} and {elseif $auth.recOrder gt 0}, {/if}{/if}
{if $auth.recOrder eq 0}{$auth.name} {/if}{$auth.given_names|regex_replace:"/([A-Z])\S+/":"$1."|strip:""}{if $auth.recOrder gt 0} {$auth.name}{/if}{if $cnt gt 1 && $auth.recOrder eq $cnt-1}. {/if}{/foreach}  {$r.date}. {*Year*}
<i>{$r.name}</i>. {*Title of book*} 

{foreach $r.Publisher_seriess as $Publisher}
	{$Publisher.recTitle} {*Title*} 
{/foreach}

</div>

{elseif $r.recTypeName=="Book chapter"}

<div>

{$cnt = count($r.Author_s_s)}
{foreach $r.Author_s_s as $auth}
{if $cnt gt 1}{if $cnt==$auth.recOrder+1} and {elseif $auth.recOrder gt 0}, {/if}{/if}
{if $auth.recOrder eq 0}{$auth.name} {/if}{$auth.given_names|regex_replace:"/([A-Z])\S+/":"$1."|strip:""}{if $auth.recOrder gt 0} {$auth.name}{/if}{if $cnt gt 1 && $auth.recOrder eq $cnt-1}. {/if}{/foreach} {$r.Book.date}. {*Year*} 

{$r.name} {*Title of chapter*}  

In {$editors = $r.Book.Author_Editor_s_s}
{$cnt = count($editors)}
{if $cnt gt 0}
{foreach $editors as $auth}
{if $cnt gt 1}{if $cnt==$auth.recOrder+1} and {elseif $auth.recOrder gt 0}, {/if}{/if}
{if $auth.recOrder eq 0}{$auth.name} {/if}{$auth.given_names|regex_replace:"/([A-Z])\S+/":"$1."|strip:""}{if $auth.recOrder gt 0} {$auth.name}{/if}{/foreach}
{if $cnt gt 1} (eds),{else} (ed.),{/if}
{elseif ($r.Book.Author_Editor_s_s.recTitle)}
{$r.Book.Author_Editor_s_s.recTitle} (ed.){/if}

<i>&nbsp;{$r.Book.name}</i>.{*Title of book*} 

{foreach $r.Book.Publisher_seriess as $Publisher}
    {$Publisher.recTitle}. {*Title*}
{/foreach}
{$r.start_page}-{$r.end_page}.
</div>

{elseif $r.recTypeName=="Journal article"}
<div>
{$cnt = count($r.Author_s_s)}
{foreach $r.Author_s_s as $auth}
{if $cnt gt 1}{if $cnt==$auth.recOrder+1} and {elseif $auth.recOrder gt 0}, {/if}{/if}
{if $auth.recOrder eq 0}{$auth.name} {/if}{$auth.given_names|regex_replace:"/([A-Z])\S+/":"$1."|strip:""}{if $auth.recOrder gt 0} {$auth.name}{/if}
{if $cnt gt 1 && $auth.recOrder eq $cnt-1}. {/if}{/foreach} {$r.Journal_volumes[0].date}. {*Year*} 

{$r.name}. {*Title of Article*} 

{foreach $r.Journal_volumes as $Journal_volume}
<i>{$Journal_volume.recTitle}</i>
{if ($Journal_volume.volume)}&nbsp;{$Journal_volume.volume}{/if}
{if (isset($Journal_volume.part_issue))}({$Journal_volume.part_issue}){/if}
{if (isset($r.start_page))}: {$r.start_page}-{$r.end_page}{/if}.

{/foreach}


</div>

{elseif $r.recTypeName=="Magazine article"}

<div>
{$cnt = count($r.Author_s_s)}
{foreach $r.Author_s_s as $auth}
{if $cnt gt 1}{if $cnt==$auth.recOrder+1} and {elseif $auth.recOrder gt 0}, {/if}{/if}
{if $auth.recOrder eq 0}{$auth.name} {/if}{$auth.given_names|regex_replace:"/([A-Z])\S+/":"$1."|strip:""}{if $auth.recOrder gt 0} {$auth.name}{/if}
{if $cnt gt 1 && $auth.recOrder eq $cnt-1}. {/if}{/foreach} {$r.Magazine_detailss[0].date}. {*Year*} 

{$r.name}. {*Title of Article*} 


{foreach $r.Magazine_detailss as $Magazine_details}
<i>{$Magazine_details.recTitle}</i>
{if ($Magazine_details.volume)}&nbsp;{$Magazine_details.volume}{/if}
{if (isset($Magazine_details.part_issue))}({$Magazine_details.part_issue}){/if}
{if (isset($r.start_page))}: {$r.start_page}-{$r.end_page}{/if}.
{/foreach}

</div>

{elseif $r.recTypeName=="Newspaper article"}

<div>
{$cnt = count($r.Author_s_s)}
{foreach $r.Author_s_s as $auth}
{if $cnt gt 1}{if $cnt==$auth.recOrder+1} and {elseif $auth.recOrder gt 0}, {/if}{/if}
{if $auth.recOrder eq 0}{$auth.name} {/if}{$auth.given_names|regex_replace:"/([A-Z])\S+/":"$1."|strip:""}{if $auth.recOrder gt 0} {$auth.name}{/if}
{if $cnt gt 1 && $auth.recOrder eq $cnt-1}. {/if}{/foreach} {$r.Newspaper_detailss[0].date}. {*Year*} 

{$r.name}. {*Title of Article*} 


{foreach $r.Newspaper_detailss as $Newspaper_details}
<i>{$Newspaper_details.recTitle}</i>
{if ($Newspaper_details.volume)}&nbsp;{$Newspaper_details.volume}{/if}
{if (isset($Newspaper_details.part_issue))}({$Newspaper_details.part_issue}){/if}
{if (isset($r.start_page))}: {$r.start_page}-{$r.end_page}{/if}.
{/foreach}

</div>

{elseif $r.recTypeName=="Report"}
<div>
{$cnt = count($r.Author_s_s)}
{foreach $r.Author_s_s as $auth}
{if $cnt gt 1}{if $cnt==$auth.recOrder+1} and {elseif $auth.recOrder gt 0}, {/if}{/if}
{if $auth.recOrder eq 0}{$auth.name} {/if}{$auth.given_names|regex_replace:"/([A-Z])\S+/":"$1."|strip:""}{if $auth.recOrder gt 0} {$auth.name}{/if}
{if $cnt gt 1 && $auth.recOrder eq $cnt-1}. {/if}{/foreach} {$r.date} {*Date*} 


{$r.name}


{foreach $r.Commissioning_organisation_publishers as $Commissioning_organisation_publisher}
{foreach $Commissioning_organisation_publisher.Publishers as $Publisher}
, {$Publisher.recTitle} 
{/foreach}
{$Commissioning_organisation_publisher.place_name} {*Place(s) of publication*} 
{/foreach}

</div>
{elseif $r.recTypeName=="Archival record"}
<div>
{$cnt = count($r.Author_s_s)}
{foreach $r.Author_s_s as $auth}
{if $cnt gt 1}{if $cnt==$auth.recOrder+1} and {elseif $auth.recOrder gt 0}, {/if}{/if}
{if $auth.recOrder eq 0}{$auth.name} {/if}{$auth.given_names|regex_replace:"/([A-Z])\S+/":"$1."|strip:""}{if $auth.recOrder gt 0} {$auth.name}{/if}
{if $cnt gt 1 && $auth.recOrder eq $cnt-1}. {/if}{/foreach} {$r.start_date} {*Date*} 

{$r.name}

{foreach $r.Record_series_detailss as $Record_series_details}
{foreach $Record_series_details.Archives_institutions as $Archives_institution}
, {$Archives_institution.recTitle} {*Title*} 	
{/foreach}
{/foreach}
</div>

{elseif ($r.recTypeName=="Other document" || $r.recTypeName=="Personal communication")}

<div>
{$cnt = count($r.Author_s_s)}
{foreach $r.Author_s_s as $auth}
{if $cnt gt 1}{if $cnt==$auth.recOrder+1} and {elseif $auth.recOrder gt 0}, {/if}{/if}
{if $auth.recOrder eq 0}{$auth.name} {/if}{$auth.given_names|regex_replace:"/([A-Z])\S+/":"$1."|strip:""}{if $auth.recOrder gt 0} {$auth.name}{/if}
{if $cnt gt 1 && $auth.recOrder eq $cnt-1}. {/if}{/foreach} {$r.date} {*Year*} 

{$r.name}

</div>
{else}

{* ignore all other types, count is reported at end *}

{$notrec = $notrec+1}
{$recognized = false}
{/if}

{if $recognized}
<br/>
{/if}
{/foreach}

{if ($notrec>0)}
<br/><b>{$notrec} records not supported by Harvard format</b>
{/if}
