function cleanUp($text) {
  $temp = $text.Split("#")[1] -replace "#", ""
  $temp = $temp -replace "_", " ";
  return $temp
}

function getMetaData($text) {
  $processed = $false
  $brewer_i = 0

  $meta = @{
    brewer = @()
    name = ""
    styles = @()
    jares = 0
    abv = 0.0
    countries = @()
  }

  $text = $text -replace "\n", " "

  $hastags = foreach ($IS_Item in $text)
    {
    @($IS_Item.Split(' ')) -match '#'
    }

  $brewer_i = $text.Split('+').GetUpperBound(0)

  For ($i=0; $i -lt $hastags.Length; $i++) {
    if ($i -le $brewer_i) {
      $meta.brewer += cleanUp $hastags[$i]
    }
    if ($i -eq $brewer_i+1) {
      $meta.name = cleanUp $hastags[$i]
    }
    if ($i -eq $brewer_i+2) {
      if ($hastags[$i].Contains("#abv_")) {
        
        $meta.styles += cleanUp $hastags[$i-1]
      } else {
        $meta.styles += cleanUp $hastags[$i]
      }
      
    }
    if ($hastags[$i].StartsWith("#abv_")) {
      $temp = $hastags[$i] -replace "#abv_", ""
      $temp = $temp -replace "_", "."
      $meta.abv = $temp -as [double]
    }
    if (($hastags[$i].EndsWith("Beers") -or $hastags[$i].EndsWith("Beer")  -or $hastags[$i].EndsWith("beers") ) -and $processed) {
      $i = $hastags.Length
    }

    if ($processed) { 
      $temp = $hastags[$i] -replace "#", ""
      if ($temp.Length -gt 0) {
        $meta.countries += $temp.replace(' ','')
      }      
    }

    try {
      if ($processed -eq $false -and $hastags[$i].EndsWith("jares")) {      
        $temp = $hastags[$i] -replace "jares", ""
        $temp = $temp -replace "#", ""
        $meta.jares = $temp -as [int]
        $processed = $true
      }
    } catch {
      Write-Host $i
      Write-Host $text
      Write-Host $hastags[$i]
    }    
  }

  #Write-Host $meta.countries.Length
  return $meta
}


$file_data = Get-Content .\original_data\posts_1.json

$replaced = [regex]::replace($file_data, '(?:\\u[0-9a-f]{4})+', { param($m) 
  $utf8Bytes = (-split ($m.Value -replace '\\u([0-9a-f]{4})', '0x$1 ')).ForEach([byte])
  [text.encoding]::utf8.GetString($utf8Bytes)
})

Set-Content -Encoding UTF8 -Path .\original_data\posts_2.json -Value $replaced

$origin_json = ConvertFrom-JSON $replaced
$destination_json = @()

For ($i=0; $i -lt $origin_json.Length; $i++) {
  if ($origin_json[$i].media[0].title.Contains("#abv_")) {
     $position = $null
     if ( $origin_json[$i].media[0].media_metadata -ne $null) {
       if ($origin_json[$i].media[0].media_metadata.photo_metadata -ne $null) {
         $position = $origin_json[$i].media[0].media_metadata.photo_metadata.exif_data[0]
       }
     }

     $metaData = getMetaData $origin_json[$i].media[0].title

     $props = @{
       text = $origin_json[$i].media[0].title
       creation_timestamp = $origin_json[$i].media[0].creation_timestamp
       img = $origin_json[$i].media[0].uri
       position = $position
       metadata = $metadata
       }

     $item = New-Object psobject -Property $props
     $destination_json += $item
  }
}
$destination_json = $destination_json | Sort-Object -Descending -Property creation_timestamp
ConvertTo-Json $destination_json -Depth 10 | Out-File -FilePath .\public\data\posts.json