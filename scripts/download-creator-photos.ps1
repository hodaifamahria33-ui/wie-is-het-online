# Direct Wikimedia thumb downloads (330px) — run once to refresh local copies
$out = Join-Path $PSScriptRoot "..\assets\creators"
New-Item -ItemType Directory -Force -Path $out | Out-Null

$dl = [ordered]@{
  mrbeast       = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/MrBeast_2023_%28cropped%29.jpg/330px-MrBeast_2023_%28cropped%29.jpg"
  pewdiepie     = "https://upload.wikimedia.org/wikipedia/commons/0/0a/Pewdiepie_head_shot_%28cropped%29.jpg"
  markiplier    = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Markiplier_in_2017.jpg/330px-Markiplier_in_2017.jpg"
  jacksepticeye = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Jacksepticeye_%28cropped%29.png/330px-Jacksepticeye_%28cropped%29.png"
  ksi           = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/JJ_Olatunji_%28KSI%29_6_%28cropped%29.jpg/330px-JJ_Olatunji_%28KSI%29_6_%28cropped%29.jpg"
  mkbhd         = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Marques_Brownlee_cropped.jpg/330px-Marques_Brownlee_cropped.jpg"
  dantdm        = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/DanTDM_in_a_Straitjacket_at_the_TommyInnit_%26_Friends_Live_Show_in_2022_%281%29.jpg/330px-DanTDM_in_a_Straitjacket_at_the_TommyInnit_%26_Friends_Live_Show_in_2022_%281%29.jpg"
  ludwig        = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Ludwig_and_Typical_Gamer_%2852900893088%29_%28Ludwig_crop%29.jpg/330px-Ludwig_and_Typical_Gamer_%2852900893088%29_%28Ludwig_crop%29.jpg"
  pokimane      = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Pokimane_at_the_Creator_Economy_Caucus_launch%2C_2025_%28cropped%29.jpg/330px-Pokimane_at_the_Creator_Economy_Caucus_launch%2C_2025_%28cropped%29.jpg"
  rosanna       = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Rosanna_Pansino_at_VidCon_2025_%28cropped%29.jpg/330px-Rosanna_Pansino_at_VidCon_2025_%28cropped%29.jpg"
  nikkie        = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/NikkieTutorials_by_Gage_Skidmore.jpg/330px-NikkieTutorials_by_Gage_Skidmore.jpg"
  ijustine      = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/IJustine_by_Gage_Skidmore.jpg/330px-IJustine_by_Gage_Skidmore.jpg"
  ishowspeed    = "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/IShowSpeed_in_2022.jpg/330px-IShowSpeed_in_2022.jpg"
  xqc           = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/xQc_in_2021.jpg/330px-xQc_in_2021.jpg"
  safiya        = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Safiya_Nygaard_by_Gage_Skidmore.jpg/330px-Safiya_Nygaard_by_Gage_Skidmore.jpg"
  zoella        = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Zoella_by_Gage_Skidmore.jpg/330px-Zoella_by_Gage_Skidmore.jpg"
  wengie        = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Wengie_by_Gage_Skidmore.jpg/330px-Wengie_by_Gage_Skidmore.jpg"
  ninja         = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Tyler_%22Ninja%22_Blevins_at_the_2019_E3.jpg/330px-Tyler_%22Ninja%22_Blevins_at_the_2019_E3.jpg"
  emma          = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Emma_Chamberlain_in_2019.jpg/330px-Emma_Chamberlain_in_2019.jpg"
  enzo          = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Enzo_Knol_%282016%29.jpg/330px-Enzo_Knol_%282016%29.jpg"
}

foreach ($kv in $dl.GetEnumerator()) {
  $ext = if ($kv.Key -eq "jacksepticeye") { ".png" } else { ".jpg" }
  $dest = Join-Path $out ($kv.Key + $ext)
  curl.exe -sL -A "WieIsHetOnline/1.0" -o $dest $kv.Value
  $len = (Get-Item $dest -ErrorAction SilentlyContinue).Length
  if ($len -gt 8000) { Write-Output "OK $($kv.Key) $len" } else { Remove-Item $dest -Force -ErrorAction SilentlyContinue; Write-Output "FAIL $($kv.Key)" }
  Start-Sleep -Milliseconds 600
}
