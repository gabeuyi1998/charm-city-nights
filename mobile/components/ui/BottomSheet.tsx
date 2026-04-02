import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Colors } from '../../constants/theme';

// Re-export core primitives from @gorhom/bottom-sheet
export { default as BottomSheet } from '@gorhom/bottom-sheet';
export {
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';

export interface CCNBottomSheetProps {
  children: React.ReactNode;
  snapPoints?: string[];
  onClose?: () => void;
}

export function CCNBottomSheet({
  children,
  snapPoints: snapPointsProp,
  onClose,
}: CCNBottomSheetProps): React.ReactElement {
  const sheetRef = useRef<GorhomBottomSheet>(null);

  const snapPoints = useMemo(
    () => snapPointsProp ?? ['25%', '50%', '90%'],
    [snapPointsProp],
  );

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        style={[props.style, styles.backdrop]}
      />
    ),
    [],
  );

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      onClose={handleClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      enablePanDownToClose
      enableDynamicSizing={false}
      index={0}
    >
      <View style={styles.content}>{children}</View>
    </GorhomBottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  content: {
    flex: 1,
  },
});
