import react, { useState } from "react"
export const EditButton = (editedPost) => {
    const [visible, setVisible] = useState(false)
    const editPost = editedPost

    const openEditPostForm = () => {
        console.log("heeerrree")
        setVisible((prev) => !prev)
        // prefillForm()
    };

    const closeEditPostForm = () => {
        setVisible((prev) => !prev)
        // prefillForm()
    };
    return (
        <>
            {visible &&
                <div className="edit-post-container">
                    <form className="edit-post-form" >
                        <button className="create-post-close-button" type="button" onClick={closeEditPostForm}>
                            <span>&times;</span>
                        </button>
                        <h1>Edit Post </h1>

                    </form>
                </div>
            }
            <button type="button" onClick={openEditPostForm}>
                <img src="../../public/assets/img/edit.png" />
            </button>
        </>
    )
}