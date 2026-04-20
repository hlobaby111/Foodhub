import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { theme } from '../utils/theme';

const { height } = Dimensions.get('window');

const LocationBottomSheet = ({ visible, onClose, onLocationSelect }) => {
  const [loading, setLoading] = useState(false);

  const handleCurrentLocation = async () => {
    setLoading(true);
    setTimeout(() => {
      const location = {
        lat: 19.0760,
        lng: 72.8777,
        address: 'Current Location',
        type: 'current'
      };
      onLocationSelect(location);
      setLoading(false);
    }, 1500);
  };

  const savedAddresses = [
    {
      id: 1,
      type: 'home',
      label: 'Home',
      address: 'Flat 204, Silver Heights, Bandra West',
      city: 'Mumbai, Maharashtra 400050',
      icon: 'home'
    },
    {
      id: 2,
      type: 'work',
      label: 'Work',
      address: 'Office 501, Business Park, Andheri East',
      city: 'Mumbai, Maharashtra 400069',
      icon: 'briefcase'
    },
    {
      id: 3,
      type: 'other',
      label: 'Other',
      address: 'Building A-12, Sector 4, Juhu',
      city: 'Mumbai, Maharashtra 400049',
      icon: 'map-marker'
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.bottomSheet}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose Location</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.primaryActionBox}
                onPress={handleCurrentLocation}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Icon name="navigation" size={24} color="white" />
                  )}
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.primaryActionTitle}>Use Current Location</Text>
                  <Text style={styles.primaryActionSubtitle}>Auto-detect using GPS</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBox}
                onPress={() => {
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainerSecondary}>
                  <Icon name="plus" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.secondaryActionTitle}>Add New Address</Text>
                  <Text style={styles.secondaryActionSubtitle}>Enter address manually</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>SAVED ADDRESSES</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.addressesContainer}>
              {savedAddresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={styles.addressCard}
                  onPress={() => onLocationSelect(address)}
                  activeOpacity={0.7}
                >
                  <View style={styles.addressIconContainer}>
                    <Icon
                      name={address.icon}
                      size={20}
                      color={theme.colors.textSecondary}
                    />
                  </View>

                  <View style={styles.addressDetails}>
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressLabel}>{address.label}</Text>
                      <View style={styles.addressTypeBadge}>
                        <Text style={styles.addressTypeText}>{address.type}</Text>
                      </View>
                    </View>
                    <Text style={styles.addressText} numberOfLines={1}>
                      {address.address}
                    </Text>
                    <Text style={styles.addressCity} numberOfLines={1}>
                      {address.city}
                    </Text>
                  </View>

                  <Icon
                    name="chevron-right"
                    size={20}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
  },
  primaryActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextContainer: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  primaryActionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  secondaryActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  actionIconContainerSecondary: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  secondaryActionSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  addressesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressDetails: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  addressTypeBadge: {
    backgroundColor: theme.colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  addressTypeText: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  addressText: {
    fontSize: 13,
    color: theme.colors.text,
    marginBottom: 4,
  },
  addressCity: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});

export default LocationBottomSheet;
