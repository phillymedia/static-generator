$(document).ready(function(){
 var customCSS = document.createElement("link")
       customCSS.setAttribute("rel", "stylesheet")
       customCSS.setAttribute("type", "text/css")
       customCSS.setAttribute("href", "http://media.philly.com/storage/inquirer/CustomShareTools/CustomSocialStylesC.css")
       $("head")[0].appendChild(customCSS);

/*
   //facebook
   $('body').prepend('<div id="fb-root"></div>');
   (function(d, s, id) {
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) return;
   js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.6";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
   //ENDfacebook
*/
   var shareUrl =window.location.href.split('?')[0];
   var shareHead = $("meta[name='twitter:title']").attr("content");
   var subject="From Philly.com: "+shareHead;
   var shareLink=encodeURI(shareUrl);
   console.info(shareLink);

   var ctool='<div class="shareBtn faceb">';
       //ctool+='<div class="fb-share-button" data-href="'+shareUrl+'" data-layout="button" data-mobile-iframe="true"></div>';
     ctool+='</div>';
     ctool+='<div class="shareBtn twit"></div>';
     ctool+='<div class="shareBtn email"></div>';
     ctool+='<div class="shareBtn comment"></div>';
     ctool+='<div class="shareBtn reprints"></div>';


 $('.custom-social-share').html(ctool);
 //Facebook_______________________________________________________________________________________

 $('.custom-social-share .faceb').click(function(e){
   window.open('https://www.facebook.com/sharer.php?u='+shareLink,'_blank');
 });
 //Twitter_______________________________________________________________________________________
 $('.custom-social-share .twit').click(function(e){
   window.open('https://twitter.com/intent/tweet?text='+shareHead+'&url='+shareLink+'&via=phillydotcom','_blank');
 });
 //Email_______________________________________________________________________________________
 $('.custom-social-share .email').click(function(e){
   window.open('mailto:?subject='+subject+'&body=Read the story here: '+shareUrl,'_self');
 });
 //comment_______________________________________________________________________________________
 $('.custom-social-share .comment').click(function(e){
   $('html, body').animate({
       scrollTop: $("#noteComments").offset().top
   }, 2000);
 });
   //reprint_______________________________________________________________________________________
 $('.custom-social-share .reprints').click(function(e){
   window.open('http://olt.theygsgroup.com/philly/','_blank')
 });


 });//docuRead
