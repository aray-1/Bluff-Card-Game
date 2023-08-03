import React from "react";

function MobileImage(){
    return (
        <div className="mobile-frame">
            <div className="mobile-top">
                <div>
                    <div className="mobile-speaker"></div>
                </div>
            </div>
            <div className="mobile-side-buttons">
                <div className="mobile-side-btn-1"></div>
                <div className="mobile-side-btn-2"></div>
            </div>
        </div>
    );
}

function RotateDevice(){
    return (
        <div className="rotate-device-container">
            <div className="mobiles">
                <div className="mobile-1">
                    <MobileImage />
                </div>
                <div className="mobile-2">
                    <MobileImage />
                </div>
            </div>
            <div className="rotate-device-message">Please Rotate The Device</div>
        </div>
    );
}

export default RotateDevice;