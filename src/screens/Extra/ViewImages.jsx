import React, {useState} from 'react';
import ImageView from 'react-native-image-viewing';
import Text from '../../components/Shared/Text';
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import {colors} from '../../config/colors';
import {TouchableOpacity, View} from 'react-native';
import {useDispatch} from 'react-redux';
import {deletePropertyImage} from '../../store/actions/dashboard/deletePropertyImage';

const ViewImages = ({navigation, route}) => {
  const {images, type, startIndex} = route.params;

  const dispatch = useDispatch();

  const [visible, setIsVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(startIndex);

  const handleDeleteImage = () => {
    // dispatch(deletePropertyImage({payload: {id:currentImage  }, cb: () => {}}));
  };

  return (
    <ImageView
      images={images}
      imageIndex={currentImage}
      visible={true}
      onImageIndexChange={index => {
        setCurrentImage(index);
      }}
      onRequestClose={() => navigation.goBack()}
      FooterComponent={() => {
        return (
          <View
            style={{
              justifyContent: 'center',
              paddingVertical: 12,
              alignItems: 'center',
            }}>
            {type === 2 ? (
              <TouchableOpacity
                onPress={() => {
                  handleDeleteImage;
                }}>
                <MaterialCommunityIcons
                  color={'#FFF'}
                  name="delete"
                  size={40}
                />
              </TouchableOpacity>
            ) : (
              <></>
            )}
          </View>
        );
      }}
    />
  );
};

export default ViewImages;
