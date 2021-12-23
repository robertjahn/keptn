package go_tests

import (
	"testing"
)

func Test_K3D(t *testing.T) {
	// Common Tests

	// Platform-specific Tests
	t.Run("Test_AirgappedImagesAreSetCorrectly", Test_AirgappedImagesAreSetCorrectly)
}
