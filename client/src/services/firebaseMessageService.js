import {
  ref,
  set,
  onValue,
  off,
  push,
  serverTimestamp,
  remove,
  update,
  get,
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

      const messageToSync = {
        ...messageData,
        _id: newMessageRef.key,
        mongoId: messageData._id, // Thêm mongoId để mapping
        timestamp: serverTimestamp(),
        isDeleted: false,
      };

      await set(newMessageRef, messageToSync);
      return newMessageRef.key; // Trả về Firebase ID
    } catch (error) {
      console.error("Firebase sync error:", error);
      throw error;
    }
  }

  // Lắng nghe tin nhắn mới theo groupId với xử lý tin nhắn đã xóa
  subscribeToGroupMessages(groupId, callback) {
    if (!groupId) return;

    const messagesRef = ref(database, `groups/${groupId}/messages`);

    const listener = onValue(messagesRef, (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        const messageId = message.mongoId || childSnapshot.key;

        // Kiểm tra xem tin nhắn có trong cache đã xóa không
        if (!message.isDeleted && !this.deletedMessagesCache.has(messageId)) {
          messages.push({
            ...message,
            id: messageId,
            _id: messageId,
            timestamp: message.timestamp || Date.now(),
          });
        }
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

  // Lấy tin nhắn của một group với xử lý tin nhắn đã xóa
  async getGroupMessages(groupId) {
    if (!groupId) throw new Error("GroupId is required");

    return new Promise((resolve, reject) => {
      const messagesRef = ref(database, `groups/${groupId}/messages`);
      onValue(
        messagesRef,
        (snapshot) => {
          const messages = [];
          snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            const messageId = message.mongoId || childSnapshot.key;

            if (
              !message.isDeleted &&
              !this.deletedMessagesCache.has(messageId)
            ) {
              messages.push({ ...message, id: messageId, _id: messageId });
            }
          });
          messages.sort((a, b) => a.timestamp - b.timestamp);
          resolve(messages);
        },
        reject,
        { onlyOnce: true }
      );
    });
  }

  // Tìm Firebase ID dựa trên MongoDB ID
  async findFirebaseIdByMongoId(groupId, mongoId) {
    const messagesRef = ref(database, `groups/${groupId}/messages`);
    const snapshot = await get(messagesRef);
    let firebaseId = null;

    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      if (message.mongoId === mongoId) {
        firebaseId = childSnapshot.key;
      }
    });

    return firebaseId;
  }

  // Soft delete tin nhắn
  async deleteMessageFromFirebase(groupId, messageId) {
    try {
      if (!groupId || !messageId) {
        throw new Error("GroupId and messageId are required");
      }

      // Tìm Firebase ID nếu messageId là MongoDB ID
      let firebaseId = messageId;
      if (!messageId.includes("-")) {
        firebaseId = await this.findFirebaseIdByMongoId(groupId, messageId);
      }

      if (!firebaseId) {
        throw new Error("Firebase message not found");
      }

      const messageRef = ref(
        database,
        `groups/${groupId}/messages/${firebaseId}`
      );

      // Cập nhật trạng thái và thời gian xóa
      await update(messageRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      });

      // Thêm cả MongoDB ID và Firebase ID vào cache
      this.deletedMessagesCache.add(messageId);
      if (firebaseId !== messageId) {
        this.deletedMessagesCache.add(firebaseId);
      }

      return true;
    } catch (error) {
      console.error("Firebase delete error:", error);
      throw error;
    }
  }

  // Clear cache
  clearDeletedMessagesCache() {
    this.deletedMessagesCache.clear();
  }
}

export const firebaseMessageService = new FirebaseMessageService();
