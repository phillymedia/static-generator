$(document).ready(function() {
    var galleries = [];
    for (var ii = 0; ii < $('.carousel.slide').length; ii++) {
        var id = $('.carousel.slide:eq(' + ii + ')').attr("class");
        var id = id.split(' ');
        galleries.push(id[2]);
    }

    var gal = [];

    for (var i = 0; i < galleries.length; i++) {
        gal.push(loadGal(galleries[i]));
    }

    for (var iii = 0; iii < galleries.length; iii++) {
        buildGal(gal[iii]);
    }

    $('.carousel').carousel({pause: true, interval: false}).carousel(0);


    function loadGal(gal) {
        // console.log(galleryURL(gal));
        // var gallery_list  = new Array();
        // if (window.XMLHttpRequest) {
        //         xmlhttp = new XMLHttpRequest();
        //     } else {
        //         xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        //     }
        //     xmlhttp.open("GET", galleryURL(gal), false);
        //     xmlhttp.send();
        //     xmlDoc = xmlhttp.responseXML;
        //     for (var i = 0; i < xmlDoc.getElementsByTagName("photo").length; i++) {
        //         var pic_i = new Object;
        //         var pic_caption = "";
        //         if (xmlDoc.getElementsByTagName("caption")[i].childNodes.length) {
        //             pic_caption = xmlDoc.getElementsByTagName("caption")[i].childNodes[0].nodeValue;
        //         }
        //         var pic_credit = "";
        //         if (xmlDoc.getElementsByTagName("photoCredit")[i].childNodes.length) {
        //             pic_credit = xmlDoc.getElementsByTagName("photoCredit")[i].childNodes[0].nodeValue;
        //         }
        //
        //         pic_i = {
        // 			id: gal,
        //             src: xmlDoc.getElementsByTagName("photo")[i].attributes.getNamedItem("name").nodeValue,
        //             caption: pic_caption,
        //             credit: pic_credit
        //
        //         };
        //         gallery_list.push(pic_i);
        //     }
        //    return gallery_list;
    } //loadGal

    function galleryURL(a) {
        // var _domain = window.location.href;
        // if (_domain.indexOf('dev.w') != -1) {
        //     return "http://dev.www.philly.com/templates/photoGalleryXML?galleryid=" + a;
        // } else if (_domain.indexOf('stage.w') != -1) {
        //     return "http://stage.www.philly.com/templates/photoGalleryXML?galleryid=" + a;
        // } else if (_domain.indexOf('/mobile.') != -1) {
        //     return "http://mobile.philly.com/templates/photoGalleryXML?galleryid=" + a;
        // } else if (_domain.indexOf('dev.mobile.') != -1) {
        //     return "http://dev.mobile.philly.com/templates/photoGalleryXML?galleryid=" + a;
        // } else if (_domain.indexOf('stage.mobile.') != -1) {
        //     return "http://stage.mobile.philly.com/templates/photoGalleryXML?galleryid=" + a;
        // } else {
        //     return "http://www.philly.com/templates/photoGalleryXML?galleryid="+a;
        // }
    } //galleryUrl
    function buildGal(mgal) {
        // var galHtml = '<div role="listbox" class="carousel-inner" alignment="true">';
        // var btns= '<ol class="carousel-indicators">';
        // for(var i=0; i<mgal.length; i++){
        // 	btns +='<li ';
        // 	if (i==0){
        // 	     btns +='class="active" ';
        // 	}
        // 	btns +='data-slide-to="'+i+'" data-target=".'+mgal[0].id+'">&nbsp;</li>';
        //
        // 	galHtml +='<div class="item';
        // 	if (i==0){
        // 	    galHtml +=' active';
        // 	}
        // 	var tempSrc = mgal[i].src;
        // 	     tempSrc = tempSrc.replace('600*450', '1100*1100');
        // 	galHtml +='" alignment="true"><img alt="" src="'+tempSrc+'"/>';
        // 	galHtml +='<div class="carousel-caption" alignment="true">'+mgal[i].credit+'</div>';
        // 	galHtml +='<div class="ccap" alignment="true">'+mgal[i].caption+'</div></div>';
        // };
        // galHtml +='</div>';
        // btns+='</ol>';
        // console.log(mgal[0].id);
        // $('.carousel.slide.'+mgal[0].id).html(galHtml);
        // $('.carousel.slide.'+mgal[0].id).append(btns);
        //
        // var controls = '<a data-slide="prev" role="button" href=".'+mgal[0].id+'" class="left carousel-control "><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span><span class="sr-only">Previous</span></a><a data-slide="next" role="button" href=".'+mgal[0].id+'" class="right carousel-control"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span><span class="sr-only">Next</span></a>';
        //
        // $('.carousel.slide.'+mgal[0].id).append(controls);

    } //buildGal
    // $('.ccap').css({
    //     'position': 'relative !important',
    //     'padding': '10px',
    //     'background-color': '#fff',
    //     'z-index': '999999',
    //     'color': '#777',
    //     'font-size': '14px',
    //     'font-weight': '200'
	//
    // });
    // $('.carousel-control.left,.carousel-control.right').css({'background-image': 'none'});
    // $('.carousel-indicators').css({'display': 'none'});
}); //docuRead
