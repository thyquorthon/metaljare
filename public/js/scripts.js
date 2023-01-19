/*
   
    Template Name : DevBlog - Personal Blog Template
    Author : UiPasta Team
    Website : http://www.uipasta.com/
    Support : http://www.uipasta.com/support/
	
	
*/



/*
   
   Table Of Content
   
   1. Preloader
   2. Smooth Scroll
   3. Scroll To Top
   4. Tooltip
   5. Popover
   6. End Box (Popup When Scroll Down)
 

*/

var entries;
var flags;
var countries_alpha_2;
var beers_drinked;
var params;
var page = { position: 0, ammount: 10, loaded:false, filter: null, area: "beers" };
var spain_provinces = ["a_coruña","alava","albacete","alicante","almeria","asturias","avila","badajoz","baleares","barcelona","burgos","caceres","cadiz","cantabria","castellon","ceuta","ciudad_real","cordoba","cuenca","girona","granada","guadalajara","guipuzkoa","huelva","huesca","jaen","la_rioja","las_palmas","leon","lleida","lugo","madrid","malaga","melilla","murcia","navarra","ourense","palencia","pontevedra","salamanca","segovia","sevilla","soria","tarragona","santa_cruz_de_tenerife","teruel","toledo","valencia","valladolid","vizcaya","zamora","zaragoza"];

//setup before functions
var typingTimer;                //timer identifier
var doneTypingInterval = 1000;  //time in ms, 5 second for example
var svgMapObj;

// MAP FUNCS
function setMap() {
  var countries = [].concat(...entries.map(e => e.metadata.countries).filter(Boolean));
  countries = [...new Set(countries.map(item => item))].sort()
  var data = {};

  for (country in countries) {
    
    var iso = countries_alpha_2[countries[country].split("_").join(" ").replace(/\b\w/g, l => l.toUpperCase())];
    if (iso) {
      var beers_by_country = entries.filter(x => x.metadata.countries.includes(countries[country]) );
      data[iso] = {birras: beers_by_country.length}
    }
  }
 
  var beers_in_uk = entries.filter(x => ( x.metadata.countries.includes('england') || x.metadata.countries.includes('scotland') || x.metadata.countries.includes('wales')))
  data["GB"] = {birras: beers_in_uk.length};
  
  data.link = "http://www.google.com";
  data.linkTarget = "_blank";

  // https://github.com/StephanWagner/svgMap/
  var svgMapData = {
    colorMax: '#CC0033',
    colorMin: '#FFE5D9',
    colorNoData: '#E2E2E2',
    data: {
      birras: {
        name: 'Birras',
        format: '{0}',
        thousandSeparator: '.',
        thresholdMax: 50,
        thresholdMin: 0
      }
    },
    applyData: 'birras',
    values: data
  }

  svgMapObj = new svgMap({
    targetElementID: 'svgMap',
    data: svgMapData
  });
}



// CATEGORIES FUNCS
function getClass(jares) {
  if (jares<4) {
      return "btn-danger"; 
  }
  if (jares>7) {
    return "btn-sucess"; 
  }
  return "btn-warning"; 
}

function getBadge(item, sortedList) {
  if (item.value == sortedList[0].value) return "badge-gold";
  if (item.value == sortedList[1].value) return "badge-silver";
  if (item.value == sortedList[2].value) return "badge-bronze";
  return "badge-light";
}
function setBadge(obj, item, winners) {
  obj.className = "";
  obj.classList.add("badge");
  obj.classList.add(getBadge(item, winners));
  obj.innerHTML = item.amount;
}

function setCategories() {
  // JARES
  var jares = [...new Set(entries.map(item => item.metadata.jares ))].sort((a,b) => a - b).map(x => ({ value: x, amount: entries.filter(y => y.metadata.jares == x ).length }));
  var winners = [...jares].sort((a, b) => b.amount - a.amount);

  var tb = document.querySelector("#content_jares");
  for (jare in jares) {
    var t = document.querySelector('#categories');
    cat_name = t.content.querySelector("#cat_name");
    cat_name.innerHTML = jares[jare].value + " Jares";

    cat_badge = t.content.querySelector("#value");
    setBadge(cat_badge, jares[jare], winners);

    var clone = document.importNode(t.content, true);
    tb.appendChild(clone);
  }


  // BREWERS
  var brewers = [...new Set([].concat(...entries.map(e => e.metadata.brewer).filter(Boolean)))].sort().map(x => ({value: x, amount: entries.filter(y => y.metadata.brewer.includes(x) ).length}))
  var winners = [...brewers].sort((a, b) => b.amount - a.amount);

  var tb = document.querySelector("#content_brewers");
  for (brewer in brewers) {
    var t = document.querySelector('#categories');
    cat_name = t.content.querySelector("#cat_name");    
    cat_name.innerHTML = brewers[brewer].value;

    cat_badge = t.content.querySelector("#value");
    setBadge(cat_badge, brewers[brewer], winners)

    var clone = document.importNode(t.content, true);
    tb.appendChild(clone);
  }

  // COUNTRIES
  var countries = [].concat(...entries.map(e => e.metadata.countries.filter( function( el ) {
    return spain_provinces.indexOf( el ) < 0;
  } )).filter(Boolean));
  var country_keys = Object.keys(countries_alpha_2)
  .reduce((destination, key) => {
    destination[key.toLowerCase().split(' ').join('_')] = countries_alpha_2[key];
    return destination;
  }, {});
  country_keys = Object.keys(country_keys);

  countries = countries.filter(c => country_keys.includes(c));
  countries = [...new Set(countries.map(item => item))].sort().map(x => ({value: x, amount: entries.filter(y => y.metadata.countries.includes(x) ).length}));
  var winners = [...countries].sort((a, b) => b.amount - a.amount);

  var tb = document.querySelector("#content_countries");
  for (country in countries) {
    var t = document.querySelector('#categories');
    cat_name = t.content.querySelector("#cat_name");
    cat_name.innerHTML = countries[country].value.split("_").join(" ");

    setBadge(cat_badge, countries[country], winners)
  
    var clone = document.importNode(t.content, true);
    tb.appendChild(clone);
  }

  // SPAIN PROVINCES
  var provinces = [].concat(...entries.map(e => e.metadata.countries.filter( function( el ) {
    return spain_provinces.indexOf( el ) >= 0;
  } )).filter(Boolean));
  provinces = [...new Set(provinces.map(item => item))].sort().map(x => ({value: x, amount: entries.filter(y => y.metadata.countries.includes(x) ).length}));
  var winners = [...provinces].sort((a, b) => b.amount - a.amount);

  var tb = document.querySelector("#content_provinces");
  for (province in provinces) {
    var t = document.querySelector('#categories');
    cat_name = t.content.querySelector("#cat_name");
    cat_name.innerHTML = provinces[province].value.split("_").join(" ");

    setBadge(cat_badge, provinces[province], winners)

    var clone = document.importNode(t.content, true);
    tb.appendChild(clone);
  }

  // STYLES
  var styles = [].concat(...entries.map(e => e.metadata.styles).filter(Boolean));
  styles = [...new Set(styles.map(item => item.toLowerCase()))].sort()
  var tb = document.querySelector("#content_styles");
  for (style in styles) {
    var t = document.querySelector('#categories');
    cat_name = t.content.querySelector("#cat_name");
    cat_name.innerHTML = styles[style];

    cat_badge = t.content.querySelector("#value");
    beers_by_style = entries.filter(x => x.metadata.styles.includes(styles[style]) )
    cat_badge.innerHTML = beers_by_style.length;

    var clone = document.importNode(t.content, true);
    tb.appendChild(clone);
  }

}

function filterOut(obj) {
  value = obj.querySelector("#cat_name").innerHTML;
  if (value.indexOf("Jares")!=-1) {
    value = value.split(" Jares").join("jares");
  }
  value = value.toLowerCase();
  value = value.split(" ").join("_");

  showBeers("#" + value);
}
function reset() {
  if (window.innerWidth>900) {
    window.scrollTo(0, 0);
  }
}

function showMap() {
  $('#content_map').fadeIn(800);
  $('#content_categories').fadeOut(500);
  $('#content_inner').fadeOut(500);
  $('#content').fadeOut(500);
  $('#post-end-message').fadeOut(100);
  $("#loading").fadeOut(100);
  $("#search-area").fadeOut(100);
  $("#search-1").fadeOut(100);
  page.area = "map";
  setTimeout(setProvincesData,100);
}

function setProvincesData() {
  var scale_colors = ['#E2E2E2','#FFE5D9','#FACFC9','#F5B8B8','#F0A1A8','#EB8A97','#CC0033']
  // SPAIN PROVINCES
  var provinces = [].concat(...entries.map(e => e.metadata.countries.filter( function( el ) {
    return spain_provinces.indexOf( el ) >= 0;
  } )).filter(Boolean));
  provinces = [...new Set(provinces.map(item => item ))].sort()

  for (province in provinces) {
    var t = document.querySelector('#categories');
    beers_by_province = entries.filter(x => x.metadata.countries.includes(provinces[province]) )
    provinces[province] = {province: provinces[province], ammount: beers_by_province.length, range: 0};
  }
  // SORT BY AMMOUNT
  provinces = provinces.sort((a, b) => a.ammount < b.ammount && 1 || -1);
  // SET RANGE AND BG COLOR
  for (i=0;i<spain_provinces.length;i++) { 
    document.getElementById(spain_provinces[i].split(" ").join("_") + '_path').style.fill = scale_colors[0];
    document.getElementById(spain_provinces[i].split(" ").join("_") + '_path').style.stroke = "#ffffff";
  }
  
  for (i=0;i<provinces.length;i++) {
    provinces[i].range = convertRange(provinces[i].ammount, [0, provinces[0].ammount], [1,6]);
    document.getElementById(provinces[i].province + '_path').style.fill = scale_colors[provinces[i].range];
  }

  // SET EVENTS
  var paths = document.querySelectorAll('[id$=_path]');
  for (i=0;i<paths.length;i++) {
    paths[i].addEventListener('mouseover', provinceMouseOverEffect);
    paths[i].addEventListener('mouseout', provinceMouseOutEffect);
  }
}

function convertRange( value, r1, r2 ) { 
  return Math.round(( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ]);
}

function provinceMouseOverEffect(event) {
  this.style.stroke = "#555555";
  this.style["stroke-width"] = 1;
  document.getElementById('spain_provinces_svg').append(this);
  var text = document.getElementById(this.id.split('_path').join('_text'))
  document.getElementById('spain_provinces_svg').append(text);
  
  var province = this.id.split('_path').join('').split('_text').join('');
  beers_by_province = entries.filter(x => x.metadata.countries.includes(province) ).length;

  if (beers_by_province==0) return;
  
  var t = document.querySelector('#province_tooltip');
  pv_name = t.content.querySelector("#pv_title");
  pv_name.innerHTML = province.split("_").join(" ");

  pv_flag = t.content.querySelector("#pv_flag");
  pv_flag.src = "/flags/4x3/" + flags[province] + ".svg";

  
  pv_ammount = t.content.querySelector("#pv_ammount");
  pv_ammount.innerHTML = beers_by_province;

  var clone = document.importNode(t.content, true);

  svgMapObj.setTooltipContent(clone);
  svgMapObj.moveTooltip(event);
  svgMapObj.showTooltip(event);
  
}
function provinceMouseOutEffect(event) {
  this.style.stroke = "#FFFFFF";
  this.style["stroke-width"] = 0.5;
  document.getElementById('spain_provinces_svg').append(this);

  // reset all texts
  for(i=0;i<spain_provinces.length;i++) {
    var text = document.getElementById( spain_provinces[i] + '_text');
    document.getElementById('spain_provinces_svg').append(text);
  }
  svgMapObj.hideTooltip(event);
}

function showCategories() {
  $('#content_categories').fadeIn(800);
  $('#content_map').fadeOut(500);
  $('#content').fadeOut(500);
  $('#content_inner').fadeOut(500);
  $('#post-end-message').fadeOut(100);
  $("#loading").fadeOut(100);
  $("#search-area").fadeOut(100);
  $("#search-1").fadeOut(100);
  page.area = "categories";
}

function showBeers(value) {
  $('#content').fadeIn(800);
  $('#content_map').fadeOut(500);
  $('#content_categories').fadeOut(500);
  $('#content_inner').fadeOut(500);
  $('#post-end-message').html('<div class="end">End</div>').fadeOut(10);
  $("#loading").fadeIn(100);  
  page.position = 0;
  page.loaded = false;
  page.filter = value;
  $('#mc-search').val(value);
  document.querySelector("#content").innerHTML="";
  reset();
  drawPosts(page.position, page.filter);
  page.area = "beers";
  $("#search-area").fadeIn(800);
  $("#search-1").fadeIn(100);
}

function showInner(value) {
  $('#content_inner').fadeIn(800);
  $('#content').fadeOut(500);
  $('#content_map').fadeOut(500);
  $('#content_categories').fadeOut(500);
  $('#post-end-message').html('<div class="end">End</div>').fadeOut(10);
  $("#loading").fadeOut(100);  
  $('#mc-search').val(value);
  document.querySelector("#content_drinked").innerHTML="";
  reset();
  drawInternal();
  page.area = "inner";
  $("#search-area").fadeIn(800);
  $("#search-1").fadeIn(100);
}

// SEARCH
function doneTyping () {
  page.position = 0;
  page.loaded = false;
  page.filter = $('#mc-search').val();
  document.querySelector("#content").innerHTML = "";
  document.querySelector("#content_drinked").innerHTML = "";
  reset();
  drawPosts(page.position, page.filter);
  drawInternal(page.filter);
}

// DRAW POSTS
function emojiFix(text) {
  return text.replace(/\\u[\dA-F]{4}/gi, 
         function (match) {
              return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
         }); 
}

function drawInternal(filter) {
  if (filter == null) {
    filtered_entries = beers_drinked
  } else {
    var filters = filter.split(' ');
    filtered_entries = beers_drinked.filter(item => {
      var result = false;
      filters.forEach(element => {
        if (item.toLowerCase().includes(element.toLowerCase())) {
          result = true;
        }
      }); 
      return result;
    });
  }

  beers = ""
  filtered_entries = filtered_entries.sort();
  for (i=0; i<filtered_entries.length; i++) {
    beers += '<span>' + filtered_entries[i] + '</span><br>';
  }
  document.querySelector("#content_drinked").innerHTML = beers;
  document.querySelector("#content_drinked_count").innerHTML = filtered_entries.length;
  $("#content_inner").fadeIn(500);
}

function drawPosts(from, filter) {
  if (page.loaded) return;
  console.log("drawing from " + from + " - " + page.ammount + " more ...");
  if ('content' in document.createElement('template')) {
    if (filter == null) {
      filtered_entries = entries
    } else {
      var filters = filter.split(' ');
      filtered_entries = entries.filter(item => {
        var result = false;
        filters.forEach(element => {
          if (item.hashtags.toLowerCase().includes(element.toLowerCase())) {
            result = true;
          }
        }); 
        return result;
      });
    }

    if (!filtered_entries || filtered_entries.length == 0) {
      var t = document.querySelector('#no_results');
      var tb = document.querySelector("#content");

      var clone = document.importNode(t.content, true);
      tb.appendChild(clone);

      page.loaded = true;

      $('#post-end-message').html('<div class="end">End</div>').fadeOut(10);
      $("#loading").fadeOut(10);
      return;
    } 

    if ((from + page.ammount) < filtered_entries.length ) {
      max = page.ammount
      $('#post-end-message').html('<div class="end">End</div>').fadeOut(100);
      $("#loading").fadeIn(100);
    } else {
      max = filtered_entries.length - from;
      $('#post-end-message').html('<div class="end">End</div>').fadeIn(800);
      $("#loading").fadeOut(100);
      page.loaded = true;
    }

    for (i=0; i<max; i++) {
      var t = document.querySelector('#blogpost');

      // BEERNAME
      beername = t.content.querySelector("#beername");
      beername.innerHTML = filtered_entries[from+i].metadata.name;

      // BREWERIES
      brewery = t.content.querySelector("#brewery");
      var brewers = "";
      for(j=0;j<filtered_entries[from+i].metadata.brewer.length;j++) {
        if (j>0) {
          brewers += " + "  ;
        }
        brewers += "<a href='#' onclick='showBeers(\"" + filtered_entries[from+i].metadata.brewer[j].split(" ").join("_") + "\")' >" + filtered_entries[from+i].metadata.brewer[j] + "</a>" 
      }
      brewery.innerHTML = brewers; //filtered_entries[from+i].metadata.brewer.sort().join(' + ');

      // TEXT
      text = t.content.querySelector("#text");
      var content = filtered_entries[from+i].text.split("\n").join("<BR>");
      if (content.endsWith('<BR><BR>')) {
        content = content.substr(0, content.length-8);
      }
      text.innerHTML = content.replace(/(^|\W)(@[a-z\d][\w-]*)/ig, "$1<a class='insta-link' href='http://www.instagram.com/$2' target='_blank'>$2</a>").replace(/\s*$/, "").replace('@','');

      // TIMESTAMP
      moment.locale('es'); 
      date = t.content.querySelector("#timestamp");
      date.innerHTML = moment.unix(filtered_entries[from+i].creation_timestamp).format("llll");

      // BEER COUNTER
      counter = t.content.querySelector("#beer_counter");
      counter.innerHTML = (i+from+1) + " de " + filtered_entries.length;

      // SET BEERSTYLES
      beerStyles = ""
      for (j=0;j<filtered_entries[from+i].metadata.styles.length;j++) {
        if (j>0) beerStyles += ", "
        beerStyles += "<a href=# onclick=showBeers('" + filtered_entries[from+i].metadata.styles[j].split(" ").join("_") + "') >" + filtered_entries[from+i].metadata.styles[j] + "</a>";
      }

      // SET COUNTRY AND FLAG
      beerFlags = "";
      for (j=0;j<filtered_entries[from+i].metadata.countries.length;j++) {
        if (flags[filtered_entries[from+i].metadata.countries[j]]) {
          assignedFlag = flags[filtered_entries[from+i].metadata.countries[j]];
        } else {
          assignedFlag = 'undefined';
        }
        if (j>0) beerFlags += " y "
        beerFlags += '<a href=# onclick=showBeers("' + filtered_entries[from+i].metadata.countries[j] + '") ><span class="flag-text"><span class="flag-icon flag-icon-'+assignedFlag+' flag-size"></span> ' + filtered_entries[from+i].metadata.countries[j].split("_").join(" ") + '</span></a> ';  
      }
      if (filtered_entries[from+i].metadata.countries.length == 0) {
        beerFlags += '<span class="flag-text"><span class="flag-icon flag-icon-undefined flag-size"></span> ??? </span> ';  
      }

      flag = t.content.querySelector("#beer-info");
      flag.innerHTML = beerFlags + " - " + beerStyles;

      // ABV SPOT
      avb = t.content.querySelector("#abv-value");
      avb.innerHTML = filtered_entries[from+i].metadata.abv + '%<br>ABV.';

      // IMAGE
      img = t.content.querySelector("#beer-image");
      img.style = 'background-image: url("images/' + filtered_entries[from+i].img + '");';
      
      img2 = t.content.querySelector("#beer-image-tag");
      img2.src = "images/" + filtered_entries[from+i].img;

      var tb = document.querySelector("#content");

      var clone = document.importNode(t.content, true);
      tb.appendChild(clone);
    }
    page.position = from + page.ammount;
  } else {
    alert("browser doesn't support this blog!")
  }
}

(function ($) {
    'use strict';
    jQuery(document).ready(function () {
      const urlSearchParams = new URLSearchParams(window.location.search);
      params = Object.fromEntries(urlSearchParams.entries());
      $('#content_categories').fadeOut(10);
      $("#search-1").fadeIn(100);
      $("#content_inner").fadeOut(100);
      $('#content_inner').fadeOut(100);      
      if (params.inner) {
        $("#link_inner").fadeIn(100);
      }
       /* Preloader */
        $(window).load(function () {
          $.ajax({
            type: 'GET',
            url: './data/beers_drinked.json',
            dataType: 'text',
            success: function(data) { 
              beers_drinked = JSON.parse(data).beers;
            }
          });
          $.ajax({
            type: 'GET',
            url: './data/countries_alpha_2.json',
            dataType: 'text',
            success: function(data) {
                countries_alpha_2 = JSON.parse(data);
                $.ajax({
                  type: 'GET',
                  url: './data/flags.json',
                  dataType: 'text',
                  success: function(data) {
                    flags = JSON.parse(data);
                    $.ajax({
                      type: 'GET',
                      url: './data/posts.json',
                      dataType: 'text',
                      success: function(data) { 
                        entries = JSON.parse(fixUnicode(data)).map(x => { return { creation_timestamp: x.creation_timestamp, text: x.text.split("#")[0], hashtags:  x.text.substr(x.text.indexOf("#"), x.text.length).split("\n").join(" "), img: x.img, position: x.position, metadata: x.metadata } });
                        drawPosts(0, null);
                        setCategories();
                        setTimeout(function() { setMap(); $("#content_map").fadeOut(100);} , 1000);
                        window.scrollTo(0, 0);
                        $('.preloader').delay(400).fadeOut('slow');
                      },
                      async: true
                    });
                  },
                  async: true
                });
              },
              async: true
            });
         });
		
       /* Smooth Scroll */
        $('a.smoth-scroll').on("click", function (e) {
            var anchor = $(this);
            $('html, body').stop().animate({
                scrollTop: $(anchor.attr('href')).offset().top - 50
            }, 1000);
            e.preventDefault();
        });
				 
       /* Scroll To Top */
        $(window).scroll(function(){
        if ($(this).scrollTop() >= 500) {
            $('.scroll-to-top').fadeIn();
         } else {
            $('.scroll-to-top').fadeOut();
         }
         });
	
        $('.scroll-to-top').click(function(){
          $('html, body').animate({scrollTop : 0},800);
          return false;
          });
		  
       /* Tooltip */
        $('[data-toggle="tooltip"]').tooltip();

       /* Popover */
        $('[data-toggle="popover"]').popover();		  
	   
        $(window).scroll(function() {
          if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight) {
            if (page.area == "beers") { drawPosts(page.position, page.filter); }
          }
        });

        var $input = $('#mc-search');
        //on keyup, start the countdown
        $input.on('keyup', function () {
          clearTimeout(typingTimer);
          typingTimer = setTimeout(doneTyping, doneTypingInterval);
        });

        //on keydown, clear the countdown 
        $input.on('keydown', function () {
          clearTimeout(typingTimer);
        });
  });
})(jQuery);
