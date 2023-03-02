import React from 'react';
import {ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import 'react-toastify/dist/ReactToastify.min.css'


export function Notification() {
    return (
        <>
            <ToastContainer
            style={{zIndex: "var(--toastify-z-index)",
                padding: "4px",
                position: "inherit",
                width: "var(--toastify-toast-width)",
                boxSizing:"border-box",
                color: "#fff"}}
                autoClose={false}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
            {/* Same as */}
        </>
    );
}