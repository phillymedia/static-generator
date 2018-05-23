// $(".adUnitWrapper").remove();

$(".new-content").css("padding-top",$("header").height())


$(document).ready(function(){
    if($(".carousel").length > 0) {
        var cnumber = 0;
        $('.carousel').carousel({pause: true, interval: false}).carousel(0);

        $(".carousel").each(function(){
            var $this = $(this);
            if($this.attr("data-ride")) {
                cnumber += 1;
            }
        })
        if(cnumber > 0) {
            alert(`Don't forget! ${cnumber} galler${cnumber > 1 ? "ies" : "y"} on the page should be replaced`)
        }
    }
})
