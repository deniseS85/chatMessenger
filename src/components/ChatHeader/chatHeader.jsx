import React from 'react';
import styles from './chatHeader.module.scss';
import menuIcon from '../../assets/img/menu-icon.png';
import defaultProfilePic from '../../assets/img/default-profile-img.png';


function ChatHeader({ selectedUser }) {
    return (
        <header className={styles.header}>
            <div className={styles.profileContainer}>
                <img 
                   src={selectedUser ? (selectedUser.profilePic || defaultProfilePic) : ''}
                    className={selectedUser ? styles.profilePic : ''} 
                />
                <div className={styles.profileInfo}>
                    <div>{selectedUser ? selectedUser.name : ''}</div>
                    <div>{selectedUser ? selectedUser.status : ''}</div>
                </div>
            </div>
            <img className={styles.menuIcon} src={menuIcon} alt="Menü" />
        </header>
    );
}

export default ChatHeader;