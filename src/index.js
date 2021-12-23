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
            alert_friendly("Tài khoản đang đăng nhập: "+window.accountId, false);
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
    let limit = totalSupply > 30 ? 30 : totalSupply;
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
                                    <button token-id="${nft.token_id}" media="${nft.metadata.media}" id="${`nft-${nft.token_id}`}" class="btn btn-success transfer-btn">Chuyển quyền sở hữu</button></p>
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
    let limit = totalSupply > 30 ? 30 : totalSupply;
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
                                                `<button token-id="${nft.token_id}" media="${nft.metadata.media}" id="${`nft-${nft.token_id}`}" class="btn btn-success transfer-btn" >Chuyển quyền sở hữu</button>`:
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
    // let _media = $("#token-media-"+_token_id).attr("src");
    let _media = $(this).attr("media");
    renderTransfer(_token_id, _media);
})

const renderTransfer =  ( _token_id, _media ) => {

    let html = `<div class="nft-hd">
                    <div class="card-header">
                        <h3 class="card-title">Chuyển NFT</h3>
                        <p class="transfer-img"><img src="${_media}" /><span class="token-id">NFT ID: ${_token_id}</span></p>
                        <p class="owner text-left">
                            <label>Tài khoản người nhận:</label>
                            <input id="account_receiver" class="form-control" value="" placeholder="Tài khoản sở hữu">
                        </p>
                        <p class="owner text-left">
                            <label>Nội dung chuyển:</label>
                            <input id="transfer_note" class="form-control" value="" placeholder="Tặng, cho, thưởng">
                        </p>
                        <p class="footer text-right top-10">
                            <button token-id="${_token_id}" id="nft-transfer-cancel" class="btn btn-default transfer-exe">Trở lại </button>
                            <button token-id="${_token_id}" id="nft-transfer-exe" class="btn btn-danger transfer-exe">Xác nhận </button>
                        <p>
                    </div>
                </div>`;

    $("#list").html(`<h3 class="header-list">Thông tin chuyển quyền sở hữu</h3>${html}`);
}

$(document).on("click", "#nft-transfer-cancel", function(){
    $("#list").html('');
    renderContractNFTHomePage();
})

$(document).on("click", "#nft-transfer-exe", function(){
    let _token_id           = $(this).attr("token-id");
    let _account_receiver   = $("#account_receiver").val();
    let _transfer_note      = $("#transfer_note").val();
    if( _account_receiver == '' ){
        alert_friendly("Vui lòng nhập tài khoản nhận NFT!", true);
    }else{
        $(this).prop("disabled", true);
        //Thực hiện chuyển khoản ở đây
        transferNFT(_account_receiver,_token_id, _transfer_note, 1);
    }
})

const transferNFT = async (_receiver_id, _token_id, _transfer_note, _approval_id) => {
    //_approval_id
    try {
        alert_friendly("Đang thực hiện chuyển ...", false);
        let callRes = await contract.nft_transfer({
                token_id: _token_id,
                receiver_id: _receiver_id,
                memo: _transfer_note != '' ? _transfer_note:"transfer ownership"
            },
            300000000000000,
            1
        );
        console.log(callRes);
        $("#home").click();
        alert_friendly(`Đã chuyển Token ID: ${_token_id} cho tài khoản ${_receiver_id}`, false);
    } catch (err) {
        console.log(err);
        alert(err.kind.ExecutionError);
        alert_friendly(`Lỗi! ${err.kind.ExecutionError}`, true);
    }
    // return res;
};
/**
 * END for transfer NFT to other
 */

setTimeout(function(){
    renderContractNFTHomePage;
}, 100);

function alert_friendly( _msg, _isError ){
    $("#msg_show").html(_msg);
    if(_isError)
        $("#msg_show").addClass("color-red");
    else
        $("#msg_show").addClass("color-green");
    
    setTimeout(function(){
        $("#msg_show").html(_msg);
        $("#msg_show").removeClass("color-red");
        $("#msg_show").removeClass("color-green");
        $("#msg_show").html('');
    }, 10000);
}