import "regenerator-runtime/runtime";
import * as nearAPI from "near-api-js";
import { initContract, login, logout } from "./utils";
const { utils } = nearAPI;
import getConfig from "./config";
const { networkId } = getConfig(process.env.NODE_ENV || "development");

$(function(){
    $("#home").click(function(){
        
        renderHome();
    })
    $("#mint").click(function(){
        $(".nav-link").removeClass("btn-primary");
        $(".nav-link").addClass("btn-warning");
        $(this).removeClass("btn-warning");
        $(this).addClass("btn-primary");
        renderContractNFT();
    })
    $("#signin").click(function(){
        if( !window.accountId )
            login();
        else{
            alert("Tài khoản đang đăng nhập:"+window.accountId);
        }
    })
})

// document.querySelector("#home").onclick = async() => {
//     renderHome();
// };

// document.querySelector("#mint").onclick = async() => {
//     renderContractNFT();
// };

// Display the signed-out-flow container
function signedOutFlow() {
    $("#signin").html("Sign In");
    $("#signout").prop("disabled", true);
    $("#home").prop("disabled", true);
    $("#mint").prop("disabled", true);
    $("#signout").prop("disabled", true);
}

// Displaying the signed in flow container and fill in account-specific data
function signedInFlow() {
    document.querySelector("#signin").innerText = window.accountId;
    document.querySelector("#signout").onclick = logout;
    document.querySelector("#signin").onclick = () => {};
    setTimeout(() => {
        renderContractNFT();
    }, 10);
}

window.nearInitPromise = initContract()
    .then(() => {
        if (window.walletConnection.isSignedIn()){
            signedInFlow();
        }else{
            signedOutFlow();
        }
    })
    .catch(console.error);

const renderHome = async() => {

    $(".nav-link").removeClass("btn-primary");
    $(".nav-link").addClass("btn-warning");
    $("#home").removeClass("btn-warning");
    $("#home").addClass("btn-primary");

    const totalSupply = parseInt(await contract.nft_total_supply());
    let limit = totalSupply > 6 ? 6 : totalSupply;
    let nfts = await contract.nft_tokens({ from_index: "0", limit: limit });
    document.querySelector("#list").innerHTML = "<p>NFT của bạn load tại đây</p>";
    let html = '';
    
    if( nfts.length > 0 ){
        nfts.forEach(async(nft, index) => {
            console.log(nft);
            html += `<div class="nft-hd">
                        <div class="card-content">
                            <div class="card-header">
                                <h3 class="card-title">${nft.metadata.title}</h3>
                                <p>NFT ID: ${nft.token_id}</p>
                                <p class="owner"> Sở hữu bởi: ${nft.owner_id}<p>
                                <p class="card-description"><i>${nft.metadata.description}</i></p>
                                <p class="footer text-right">
                                    <button token-id="${nft.token_id}" id="${`nft-${nft.token_id}`}" class="btn btn-success transfer-btn">Chuyển quyền sở hữu</button></p>
                                <p class="card-media"><img id="token-media-${nft.token_id}" src="${nft.metadata.media}" /></p>
                            </div>
                        </div> 
                    </div>`;
        });
    }

    document.querySelector("#list").innerHTML = `<h3 class="header-list">DANH SÁCH NFT CỦA TÔI</h3>${html}`;
};

$(document).on("click", "button.transfer-btn", function(){
    let _token_id = $(this).attr("token-id");
    let _media = $("#token-media-"+_token_id).attr("src");
    renderTransfer(_token_id, _media);
})

const renderTransfer =  ( _token_id, _media ) => {

    let html = `<div class="nft-hd">
                    <div class="card-header">
                        <h3 class="card-title">Chuyển quyển sở hữu NFT của bạn</h3>
                        <p>NFT ID: ${_token_id}</p>
                        <p class=""><img src="${_media}" /></p>
                        <p class="owner">
                            <label>Tài khoản người nhận:</label>
                            <input id="account_receiver" class="form-control" value="" placeholder="Tài khoản sở hữu">
                        <p>
                        <p class="footer text-right">
                            <button token-id="${_token_id}" id="nft-transfer-exe" class="btn btn-danger transfer-exe">Xác nhận </button></p>
                        <p>
                    </div>
                </div>`;

    $("#list").html(`<h3 class="header-list">Thông tin chuyển quyền sở hữu</h3>${html}`);
}

$(document).on("click", "#nft-transfer-exe", function(){
    let _token_id           = $(this).attr("token-id");
    let _account_receiver   = $("#account_receiver").val();
    //Thực hiện chuyển khoản ở đây
    alert(`Thông tin chuyển khoản đã được thu nhận tiến hành chuyển khoản thôi: ${_token_id} và người nhận ${_account_receiver}`)
})

const renderContractNFT = async() => {

    $(".nav-link").removeClass("btn-primary");
    $(".nav-link").addClass("btn-warning");
    $("#mint").removeClass("btn-warning");
    $("#mint").addClass("btn-primary");

    const totalSupply = parseInt(await contractNFTHolder.nft_total_supply());
    let limit = totalSupply > 10 ? 10 : totalSupply;
    let nfts = await contractNFTHolder.nft_tokens({ from_index: "0", limit: limit });
    document.querySelector("#list").innerHTML = "<p>TRONG KHO KHÔNG CÓ CONTRACT NÀO!</p>";
    let html = '';
    
    if( nfts.length > 0 ){
        nfts.forEach((nft, index) => {
            html += `<div class="nft-hd">
                        <div class="card-content">
                            <div class="card-header">
                                <h3 class="card-title">${nft.metadata.title}</h3>
                                <p>NFT ID: ${nft.token_id}</p>
                                <p class="owner"> Sở hữu bởi: ${nft.owner_id}<p>
                                <p class="card-description"><i>${nft.metadata.description}</i></p>
                                <p class="footer text-right">
                                    ${window.accountId == nft.owner_id ? 
                                                `<button class="btn btn-primary">Chuyển quyền sở hữu</button>`:
                                                `<button disabled class="btn btn-default">Chuyển quyền sở hữu</button>`}
                                </p>
                                <p class="card-media"><img src="${nft.metadata.media}" /></p>
                            </div>
                        </div> 
                    </div>`;
        });

    }

    document.querySelector("#list").innerHTML = `<h3 class="header-list">DANH SÁCH CÒN TRONG KHO NFT-FACTORY</h3>${html}`;

};


setTimeout(function(){
    renderHome;
}, 100);