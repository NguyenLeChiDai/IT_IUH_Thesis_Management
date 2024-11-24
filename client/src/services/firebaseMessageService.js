// src/services/firebaseService.js
import {
  ref,
  set,
  onValue,
  off,
  push,
  serverTimestamp,
  remove,
} from "firebase/database";
import { database } from "../firebase/ConfigFirebase";

class FirebaseMessageService {
  constructor() {
    this.listeners = new Map();
    this.deletedMessagesCache = new Set();
  }

  // Gửi tin nhắn lên Firebase
  async syncMessageToFirebase(messageData) {
    try {
      if (!messageData.groupId) {
        throw new Error("Missing required message data");
      }

      const messagesRef = ref(
        database,
        `groups/${messageData.groupId}/messages`
      );
      const newMessageRef = push(messagesRef);

      await set(newMessageRef, {
        ...messageData,
        _id: newMessageRef.key,
        timestamp: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("Firebase sync error:", error);
      throw error;
    }
  }

  // Lắng nghe tin nhắn mới theo groupId
  subscribeToGroupMessages(groupId, callback) {
    if (!groupId) return;

    const messagesRef = ref(database, `groups/${groupId}/messages`);

    const listener = onValue(messagesRef, (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        messages.push({
          ...message,
          id: childSnapshot.key,
          timestamp: message.timestamp || Date.now(),
        });
      });

      messages.sort((a, b) => a.timestamp - b.timestamp);
      callback(messages);
    });

    this.listeners.set(groupId, { ref: messagesRef, listener });
  }

  // Hủy đăng ký lắng nghe
  unsubscribeFromGroupMessages(groupId) {
    const listenerData = this.listeners.get(groupId);
    if (listenerData) {
      off(listenerData.ref, "value", listenerData.listener);
      this.listeners.delete(groupId);
    }
  }

  // Lấy tin nhắn của một group
  async getGroupMessages(groupId) {
    if (!groupId) throw new Error("GroupId is required");

    return new Promise((resolve, reject) => {
      const messagesRef = ref(database, `groups/${groupId}/messages`);
      onValue(
        messagesRef,
        (snapshot) => {
          const messages = [];
          snapshot.forEach((childSnapshot) => {
            messages.push({
              ...childSnapshot.val(),
              id: childSnapshot.key,
            });
          });
          messages.sort((a, b) => a.timestamp - b.timestamp);
          resolve(messages);
        },
        reject,
        { onlyOnce: true }
      );
    });
  }

  // Thêm phương thức xóa tin nhắn
  async deleteMessageFromFirebase(groupId, messageId) {
    try {
      if (!groupId || !messageId) {
        throw new Error("GroupId and messageId are required");
      }

      const messageRef = ref(
        database,
        `groups/${groupId}/messages/${messageId}`
      );
      await remove(messageRef);
      return true;
    } catch (error) {
      console.error("Firebase delete error:", error);
      throw error;
    }
  }

  // Thêm phương thức clear cache

  clearDeletedMessagesCache() {
    if (this.deletedMessagesCache) {
      this.deletedMessagesCache.clear();
    } else {
      this.deletedMessagesCache = new Set();
    }
  }
}

export const firebaseMessageService = new FirebaseMessageService();
