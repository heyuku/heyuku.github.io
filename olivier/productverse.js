async function getLastArticles() {
    let res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/productverse");
    if (res.status != 200)
        return;

    let data = await res.json();
    if (data.items == null || data.items.length ==0 )
        return;

    
    var div = document.getElementById('last-productverse');
    var insideP = div.getElementsByTagName('p')[0];
    var ul = document.createElement("ul");
    insideP.appendChild(ul);

    data.items.forEach(element => {
        var li = document.createElement("li");
        li.className = 'brz-bcp-color7 brz-fs-lg-16 brz-fs-sm-im-16 brz-fs-xs-im-16 brz-ls-lg-0 brz-ls-sm-im-0 brz-ls-xs-im-0 brz-ff-red_hat_text brz-ft-google brz-fw-lg-400 brz-fw-sm-im-400 brz-fw-xs-im-500 brz-lh-lg-1_6 brz-lh-sm-im-1_3 brz-lh-xs-im-1_3';
        var a = document.createElement("a");
        a.href = element.link;
        a.target = "_blank";
        a.className = "link--external";
        a.innerText = element.title;
        li.appendChild(a);
        ul.appendChild(li);
    });
}

/* 
 $(document).ready( function () {
    getLastArticles();
 });

window.onload = function(e){ 
    getLastArticles();    
}
*/