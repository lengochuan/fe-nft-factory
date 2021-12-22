import "regenerator-runtime/runtime";
import * as nearAPI from "near-api-js";
import { initContract, login, logout } from "./utils";
const { utils } = nearAPI;
import getConfig from "./config";
const { networkId } = getConfig(process.env.NODE_ENV || "development");

$(function(){

    $("#home").click(function(){
        renderContractNFTHomePage();
    })
    
    $("#my_nft").click(function(){
        renderMyNFT();
    })

    $("#signin").click(function(){
        if( !window.accountId )
            login();
        else{
            alert("Tài khoản đang đăng nhập: "+window.accountId);
        }
    })

})

// Display the signed-out-flow container
function signedOutFlow() {
    $("#signin").html("Sign In");
    $("#my_nft").prop("disabled", true);
    $("#signout").hide();
    setTimeout(() => {
        renderContractNFTHomePage();
    }, 10);
}

// Displaying the signed in flow container and fill in account-specific data
function signedInFlow() {
    document.querySelector("#signin").innerText = window.accountId;
    document.querySelector("#signout").onclick = logout;
    document.querySelector("#signin").onclick = () => {};
    setTimeout(() => {
        renderContractNFTHomePage();
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

const renderMyNFT = async() => {

    $(".nav-link").removeClass("btn-success");
    $(".nav-link").addClass("btn-primary");
    $("#my_nft").removeClass("btn-primary");
    $("#my_nft").addClass("btn-success");

    const totalSupply = parseInt(await contract.nft_supply_for_owner({ account_id: window.accountId}));
    let limit = totalSupply > 6 ? 6 : totalSupply;
    let nfts = await contract.nft_tokens_for_owner({ account_id: window.accountId, from_index: "0", limit: limit });
    document.querySelector("#list").innerHTML = "<p>NFT của bạn load tại đây</p>";
    let html = '';

    if( nfts.length > 0 ){
        nfts.forEach(async(nft, index) => {
            console.log(nft);
            html += `<div class="nft-hd">
                        <div class="card-content">
                            <div class="card-header">
                                <p class="card-media"><img id="token-media-${nft.token_id}" src="${nft.metadata.media}" /><span class="token-id">NFT ID: ${nft.token_id}</span></p>
                                <h3 class="card-title">${nft.metadata.title}</h3>
                                <p class="owner"> Sở hữu bởi: ${nft.owner_id}</p>
                                <p class="card-description"><i>${nft.metadata.description}</i></p>
                                <p class="footer text-right">
                                    <button token-id="${nft.token_id}" id="${`nft-${nft.token_id}`}" class="btn btn-success transfer-btn">Chuyển quyền sở hữu</button></p>
                            </div>
                        </div> 
                    </div>`;
        });
    }

    document.querySelector("#list").innerHTML = `<h3 class="header-list">DANH SÁCH NFT CỦA TÔI</h3>${html}`;
};

const renderContractNFTHomePage = async() => {

    $(".nav-link").removeClass("btn-success");
    $(".nav-link").addClass("btn-primary");
    $("#home").removeClass("btn-primary");
    $("#home").addClass("btn-success");

    const totalSupply = parseInt(await contract.nft_total_supply());
    let limit = totalSupply > 10 ? 10 : totalSupply;
    let nfts = await contract.nft_tokens({ from_index: "0", limit: limit });
    document.querySelector("#list").innerHTML = "<p>TRONG KHO KHÔNG CÓ CONTRACT NÀO!</p>";
    let html = '';
    
    if( nfts.length > 0 ){
        nfts.forEach((nft, index) => {
            html += `<div class="nft-hd">
                        <div class="card-content">
                            <div class="card-header">
                                <p class="card-media"><img id="token-media-${nft.token_id}" src="${nft.metadata.media}" /><span class="token-id">NFT ID: ${nft.token_id}</span></p>
                                <h3 class="card-title">${nft.metadata.title}</h3>
                                <p class="owner">Sở hữu bởi: <b>${nft.owner_id}</b></p>
                                <p class="card-description">${nft.metadata.description}</p>
                                <p class="footer text-center">
                                    ${window.accountId == nft.owner_id ? 
                                                `<button token-id="${nft.token_id}" id="${`nft-${nft.token_id}`}" class="btn btn-success transfer-btn" >Chuyển quyền sở hữu</button>`:
                                                `<button disabled class="btn btn-default">Chuyển quyền sở hữu</button>`}
                                </p>
                            </div>
                        </div> 
                    </div>`;
        });
    }

    document.querySelector("#list").innerHTML = `<h3 class="header-list">DANH SÁCH TRONG KHO NFT-FACTORY</h3>${html}`;

};

/**
 * BEGIN for transfer NFT to other
 */
$(document).on("click", "button.transfer-btn", function(){
    let _token_id = $(this).attr("token-id");
    let _media = $("#token-media-"+_token_id).attr("src");
    renderTransfer(_token_id, _media);
})

const renderTransfer =  ( _token_id, _media ) => {

    let html = `<div class="nft-hd">
                    <div class="card-header">
                        <h3 class="card-title">Chuyển NFT</h3>
                        <p class="transfer-img"><img src="${_media}" /><span class="token-id">NFT ID: ${_token_id}</span></p>
                        <p class="owner">
                            <label>Tài khoản người nhận:</label>
                            <input id="account_receiver" class="form-control" value="" placeholder="Tài khoản sở hữu">
                        </p>
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
    transferNFT(_account_receiver,_token_id, 1);
})

const transferNFT = async (_receiver_id, _token_id, _approval_id) => {
    //_approval_id
    try {
        let callRes = await contract.nft_transfer({
                token_id: _token_id,
                receiver_id: _receiver_id,
                memo: "transfer ownership"
            },
            300000000000000,
            1
        );
        console.log(callRes);
    } catch (err) {
        console.log(err);
    }
    // return res;
};
/**
 * END for transfer NFT to other
 */

setTimeout(function(){
    renderContractNFTHomePage;
}, 100);